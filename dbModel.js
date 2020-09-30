import mongoose from 'mongoose'



const instance = mongoose.Schema({
    caption:String,
    user:String,
    image:String,
    comments:[],
});

// instance.method("transform", function () {
//   var obj = this.toObject();
//   // rename _id to id
//   obj.id = obj._id;
//   delete obj._id;
//   return obj;
// });
export default mongoose.model('post', instance);
