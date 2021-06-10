const User = require("../models/userModel");

const adminAuth = async( req,res, next) => {
    try{
    const user = await User.findOne({_id:req.user._id});
    if(user.role !== 1) return res.status(400).json({msg: "Admin Resource Denied"});
    next();

    }catch(err){
        return res.status(500).json({msg: err.message});
    }

}

module.exports = adminAuth;
