import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import dbModel from "./dbModel.js";
import postModel from "./postModel.js";
// require("dotenv").config();
import "dotenv/config.js";
// app config
const app= express();
const port = process.env.PORT||8080;


var pusher = new Pusher({
  appId: process.env.PUSHER_API_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "us2",
  usetls: true,
});

// middleware
 app.use(express.json());
 app.use(cors());
// DB comfig
const connection_url =process.env.MONGOO_DB_CONNECT;
 
mongoose.connect(connection_url, {
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
})

mongoose.connection.once('open' , ()=> {
    console.log('DB connection');
    const changeStream = mongoose.connection.collection('posts').watch()
    changeStream.on('change', (change) => {
        console.log('trigger on pusher');
        console.log(change);
        console.log('end change');
        if(change.operationType ==='insert'){
            console.log('trigger pusher');
            const postDetails = change.fullDocument;
            // console.log(postDetails);
            pusher.trigger("posts", "inserted", {
              user: postDetails.user,
              caption: postDetails.caption,
              image: postDetails.image,
             
            });
        }else if (change.operationType === 'update'){
          console.log('trigger update comment');
          const postDetails = change.updateDescription.updatedFields;
          pusher.trigger("posts", "updated", {
            comments: postDetails,
          });
          // to do an update in a fiend what need is that you only provide the updatefield for the data that update, in backend
          // it will auto parsing in front end 

        }
        else{
            console.log('Error triggering pusher');
        }


    })
})
//api routes
app.get('/', (req, res)=> res.status(200).send('hello world'));

app.post('/upload',(req, res)=> {
    //this will upload logic
    const body = req.body;
    dbModel.create(body, (err, data)=> {
        if (err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    });
});
app.patch('/upload', (req, res)=> {
    // console.log(req.body.postId);
    dbModel.findById(req.body.postId, (err, data)=> {
      if(err){
        console.log(err);
      }
      else{
        
        var newComment = postModel.create({username: req.body.user.displayName, text: req.body.comment}, (error, post)=>{
          if(error){
            res.status(500).send(error);
          }else{
            res.status(201).send(post);
             data.comments.push(post);
             data.save();
          }
        });
       
        // console.log(newComment);
        // console.log('data found');


      }
    });
    // console.log('add comment');
});
app.get(`/sync`, (req, res)=> {
    dbModel.find((err, data)=> {
         if (err) {
           res.status(500).send(err);
         } else {
           res.status(200).send(data);
         }
    })
})
app.get('/sync/:id',(req, res)=> {
  
      const _id = req.params.id;
     
      dbModel
        .findById(_id)
        .then((apost) => {
          if (!apost) {
            return res.status(404).send();
          }
           console.log(apost);
          res.send(apost);
        })
        .catch((e) => {
          res.status(500).send();
        });
  // dbModel.find( (err, data) => {
  //   if (err) {
  //     res.status(500).send(err);
  //   } else {
  //     if(data.comments){
  //         console.log(data.comments);
  //         res.status(200).send(data);
  //     }
      
      
  //   }
  // });
})
//listen
app.listen(port, ()=> console.log(`listening on localhost: ${port}`));



;