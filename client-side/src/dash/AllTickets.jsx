import Dashboard from "@/components/Dashboard";
import React, { useEffect, useState } from "react";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import MakePost from "./MakePost";
import "./DashCSS/AllTickets.css";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import del from "../assets/delete.png"
import edit from "../assets/edit.png"
import user from "../assets/profile.png"
import ConfirmDelete from "./ConfirmDelete";
import ConfirmUpdate from "./ConfirmUpdate";

function AllTickets() {

  const getStatusStep = (status) => {
    switch (status) {
      case "Submitted":
        return 0;
      case "In Progress":
        return 1;
      case "Resolved":
        return 2;
      default:
        return 0;
    }
  };

  const [complaintData, setComplaintData] = useState({
    title: "",
    content: "",
    picture: [],
    username: sessionStorage.getItem("username"),
    universityID: "",
    hostel: "",
  });
  
  const [imageUpload, setImageUpload] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [showMakePost, setShowMakePost] = useState(false);
  const [post, setPost] = useState([]);
  const [imageIndex, setImageIndex] = useState(Array(post.length).fill(0));
  const [likes, setLikes] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletePost, setDeletePost] = useState(null)

  const [updatePost, setUpdatePost] = useState(false)
  const [updateID, setUpdateID] = useState(null)
  const [toSend, setToSend] = useState(null)
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_URI}/complaint/viewpost`)
      .then((res) => res.json())
      .then((res) => {
        // console.log(res)
        setPost(res)
        setImageIndex(Array(res.length).fill(0));
        const initialLikes = {};
        res.forEach((post) => {
          initialLikes[post._id] = false;
        });
        setLikes(initialLikes);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [setPost, setImageUrls, setLikes, setUpdatePost, setShowMakePost, showMakePost]);

  const toggleLike = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId]
    }));
  };

  const uploadImage = (e) => {
    e.preventDefault();
    setUploading(true)
    if (!imageUpload) {
      return;
    }
    imageUpload.forEach((file) => {
      const imageRef = ref(storage, `images/${file.name + v4()}`);
      uploadBytes(imageRef, file)
        .then((e) => {
          getDownloadURL(e.ref).then((url) => {
            setImageUrls((prev) => [...prev, url]);
            setComplaintData((prevData) => ({
              ...prevData,
              picture: url,
            }));
          });
          setUploading(false)
        })
        .catch((err) => {
          toast.error("There was an error while uploading your image");
          console.log(err);
          setUploading(false)
        });
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name == "picture") {
      setComplaintData((prevData) => ({
        ...prevData,
        picture: imageUrls,
      }));
    } else {
      setComplaintData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      complaintData.picture = imageUrls;
      const tosend = complaintData;
      const response = await fetch(
        `${import.meta.env.VITE_URI}/complaint/makepost`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tosend),
        }
      );

      if (response.ok) {
        setComplaintData({
          title: "",
          content: "",
          picture: [],
          username: "",
          universityID: "",
          hostel: "",
        });
        setImageUpload([]);
        setImageUrls([]);
        toast.success("Your post is now live !");
      } 
      
      else if (response.status === 400) {
        toast.error("Please upload relevant pictures to your problem");
      } 
      
      else {
        toast.error("There was a server error");
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLeft = (fileid) => {
    const postIndex = post.findIndex((e) => e._id === fileid);
    if (postIndex !== -1) {
      setImageIndex((prevIndexes) => {
        const updatedIndexes = [...prevIndexes];
        updatedIndexes[postIndex] = Math.max(updatedIndexes[postIndex] - 4, 0);
        return updatedIndexes;
      });
    }
  };

  const handleRight = (fileid, totalImages) => {
    const postIndex = post.findIndex((e) => e._id === fileid);
    if (postIndex !== -1) {
      setImageIndex((prevIndexes) => {
        const updatedIndexes = [...prevIndexes];
        updatedIndexes[postIndex] = Math.min(updatedIndexes[postIndex] + 4, totalImages);
        return updatedIndexes;
      });
    }
  };

  const handledeletePost = (id) => {
    setDeletePost(id)
    setConfirmDelete(true);
  };

  const handleeditpost = (id) => {
    setUpdateID(id)
    setUpdatePost(true)
    post.forEach((e) => {
      if (e._id == id) {
        setToSend(e)
      }
    })
  }
  
  useEffect(() => {
    if (updateID && updatePost) {
      const updatedToSend = post.find((e) => e._id === updateID);
      if (updatedToSend) {
        setToSend(updatedToSend);
      }
    }
  }, [updateID, updatePost, setUpdateID, setUpdatePost]);

  return (
    <>
    <section className="main">
      <div className="dashboard-parent">
      <Dashboard />
      </div>
      <div className="main-child flex flex-col justify-center items-center w-full">
        <button
          id="goback-toview"
          className="publish text-sm"
          onClick={() => setShowMakePost(!showMakePost)}
        >
          {showMakePost ? (
            <h2>
              <i className="bx bxs-arrow-to-left"></i> Go back to viewing all
              posts
            </h2>
           ) : (
            "Click to make a post"
          )}
        </button>

      {showMakePost ? (
        <MakePost
          setImageUpload={setImageUpload}
          uploadImage={uploadImage}
          imageUpload={imageUpload}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          complaintData={complaintData}
          uploading={uploading}
       />
       ) : (
        <>
         <div className="allpost">
         {Array.isArray(post) && post.map((file, index) => (
          <div className="eachpost" key={file._id}>

            <div className="firstrow flex flex-row items-center justify-between">
              <div><h3 className="text-darkred font-bold flex flex-row items-center user"> <img style={{height: "8vh", width: "8vh", boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.6)", borderRadius: "50%"}} src={user} alt="" className="mr-3" />{file.username}</h3></div>
              <div className="progress-tracker flex flex-row">
                status of complaint
              </div>
            </div>

            <div className="secondrow">
              <h3 className="flex items-center"><i className='bx bxs-id-card mr-1 text-3xl' style={{color: "#900000"}}></i>University ID: <span>{file.universityID}</span></h3>
              <h3 className="flex items-center"><i className='bx bxs-building-house mr-1 text-3xl' style={{color: "#900000"}}></i>Hostel: <span>{file.hostel}</span></h3>
              <h3 className="flex items-center"><i className='bx bxs-book-open mr-1 text-3xl' style={{color: "#900000"}}></i>Issue: <span>{file.title}</span></h3>
            </div>

            <div className="thirdrow">
              <span className="ml-4">
              <h3 className="font-bold underline mb-2">Description: </h3>
              <span>
              {file.content}
              </span>
              </span>
            {/* </div> */}

            {/* <div className="fourthrow image-slider"> */}
              {file.picture && file.picture.length > 0 && (
                <div className="image-slider-controls flex flex-col w-fit">
                  <div className="flex items-center justify-between">
                    <div>
                    <ArrowBackIosIcon
                      className={imageIndex[index] > 0 ? "workingarrow" : "disablearrow"}
                      onClick={() => handleLeft(file._id)}
                      />
                    </div>
                    <div className="image-slider-content flex">
                      {file.picture
                        .slice(imageIndex[index], imageIndex[index] + 4)
                        .map((image, imgIndex) => (
                          <img key={imgIndex} src={image} alt={`img-${imgIndex}`} />
                        ))}
                    </div>
                    <div>
                    <ArrowForwardIosIcon
                      className={
                        imageIndex[index] + 4 < file.picture.length
                        ? "workingarrow"
                        : "disablearrow"
                      }
                      onClick={() => handleRight(file._id, file.picture.length)}
                      />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm mt-2 text-center">
                      {Math.min(imageIndex[index] + 4, file.picture.length)} of {file.picture.length} image(s)
                    </h5>
                  </div>
                </div>
              )}
            </div>

          {confirmDelete ? <ConfirmDelete deletePost={deletePost} setConfirmDelete={setConfirmDelete} setDeletePost={setDeletePost} /> : null}
          {updatePost ? <ConfirmUpdate updateID={updateID} setUpdateID={setUpdateID} setUpdatePost={setUpdatePost} toSend={toSend} complaintData={complaintData} setComplaintData={setComplaintData} setPost={setPost} /> : null}
            
            <hr className="fifthrow" />
            <div className="fifthrow">
            <span className="flex flex-row justify-between mt-3" id="last-buttons">
                   <div onClick={() => toggleLike(file._id)}>
                     {!likes[file._id] ? (
                      <i className='bx bx-like text-5xl text-darkred ml-5'></i>
                    ) : (
                      <i className='bx bxs-like text-5xl text-darkred ml-5'></i>
                    )}
                  </div>
                    <div className="flex flex-row items-center gap-4 mr-8">
                      {sessionStorage.getItem("role") == "admin" || file.username == sessionStorage.getItem("username") ? 
                      <>
                      <button className="flex flex-row items-center" onClick={() => handleeditpost(file._id)} >Edit <img src={edit} alt="edit" className="ml-1"/> </button>
                      <button className="flex flex-row items-center" onClick={() => handledeletePost(file._id)}>Delete <img src={del} alt="delete" className="ml-1"/></button>
                      </>
                      : null}
                    </div>
                  </span>
              </div>
            </div>         
          ))}
          </div>
        </>
          )}   
        </div>
      </section>
      <ToastContainer />
    </>
  );
}

export default AllTickets;
