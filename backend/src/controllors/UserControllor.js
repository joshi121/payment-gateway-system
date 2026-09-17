//register controller and Login controllor 
import User from "../models/UserModel.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { emailQueue } from "../queues/email.queue.js"
import tokenBlackListModel from "../models/blacklistmodel.js"

export const Register = async (req ,res)=>{
    try {
        const {name , email , password} = req.body;
        const isUser = await User.findOne({email});
        if(isUser){
            return res.status(500).json({
                message:"user already registered"
            });
        }
        const Hashedpassword =await  bcrypt.hash(password ,10);
        const newUser =await User.create({
            name,
            email,
            password:Hashedpassword
        })

        const token = jwt.sign({userId:newUser._id} , process.env.JWT_SECRET_KEY, {expiresIn : '1d'});

        const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction ? true : false,
        });

        // Offload email sending to BullMQ queue (< 2ms execution)
        await emailQueue.add('sendWelcomeEmail', {
            type: 'REGISTRATION',
            payload: { email: newUser.email, name: newUser.name }
        });

        res.status(201).json({
            message:"account created successfully",    
            id : newUser._id,
            name : newUser.name,
            email: newUser.email
            
        });

        
    
    }catch(error){
        console.error("Registration Error:", error);
        return res.status(401).json({
            message:"internal Server Error"
        })
    }
}

export const Login = async (req , res)=>{
    try {
        const {email , password} = req.body;
        const isUser = await User.findOne({email}).select("+password");;
        if(!isUser){
            return res.status(401).json({
                message:"invalid email or password"
            });
        }
        const userExists =await  bcrypt.compare(password , isUser.password);

        if(!userExists){
            return res.status(401).json({
                message:"invalid email or password"
            });
        }

        const token = jwt.sign({userId:isUser._id} , process.env.JWT_SECRET_KEY, {expiresIn : '1d'});

        const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction ? true : false,
        });

        res.status(200).json({
            message:"logged in successfully",    
            id : isUser._id,
            name : isUser.name,
            email: isUser.email    
        });
    
    }catch(error){
        console.error("Registration Error:", error);
        return res.status(500).json({
            message:"internal Server Error"
        })
    }

}

export const Logout =  async (req, res)=> {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}
