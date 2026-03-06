import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redis } from '../lib/redis.js';
import { OAuth2Client } from "google-auth-library"; 

const generateTokens = (userId) => {
    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
    });

    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken , refreshToken };

};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, // prevent XSS attacks, cross site scripting attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 50 * 1000, // 7 days
    });
};

export const signup = async ( req, res ) => {
    const { email, password, username, maSinhVien } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if(userExists) {
            return res.status(400).json({message: "User already exists!"});
        }

        // 🔍 Validate mã sinh viên (6 digits)
        if (!/^\d{6}$/.test(maSinhVien)) {
        return res.status(400).json({ message: "Mã sinh viên phải gồm đúng 6 chữ số!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hashSync(password , salt);

        const user= await User.create({ 
            email,
            password: hashedPassword,
            username,
            maSinhVien
        });

        // ---- AUTHENTICATION ----
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        // ---- COOKIES ----
        setCookies( res, accessToken, refreshToken );

        res.status(201).json({
            message: 'Chào Thành Viên Mới!',
            userData : {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                maSinhVien: user.maSinhVien,
            }
        });

        console.log({
            message:"Chào Thành Viên Mới!", 
            userData: user 
        })

        // Testing
        // res.status(201).json({user})

    } catch(error) {
        console.log("Error in Sign Up controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🧩 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email hoặc Mật Khẩu không hợp lệ!" });
    }

    // 🔐 Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email hoặc Mật Khẩu không hợp lệ!" });
    }

    // 🪪 Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    // ✅ Respond
    res.status(200).json({
      message: "Welcome Back User!",
      userData: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        
      },
    });

    console.log({
      message: "Welcome Back User!",
      userData: user,
    });
  } catch (error) {
    console.log("Error in Log In controller", error.message);
    res.status(500).json({ message: error.message });
  }
};


export const logout = async ( req, res ) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken) {
           const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
           await redis.del(`refresh_token:${decoded.userId}`);
           console.log('Decoded Token: ', decoded);

           res.clearCookie("accessToken");
           res.clearCookie("refreshToken");
           res.json({ message: "Logged out successfully" });
           
        } else {
            return res.status(401).json({message: "No refreshToken found"});
        }

    } catch(error) {
        console.log("Error in Log Out controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const refreshToken = async ( req, res ) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(401).json({message: "No refresh token provided"});
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('Decoded Token: ', decoded);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if(storedToken !== refreshToken ) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000,
        });

        res.json({ message: "Token Refresh Token successfully" });

    } catch(error) {
        console.log("Error in Refresh Token controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const getProfile = async ( req, res ) => {
    try {
        res.json(req.user)
    } catch(error) {
        console.log("Error in Get Profile controller", error.message);
        res.status(500).json({ message: error.message });
    }   
}


// ================== GOOGLE LOGIN (ACCESS TOKEN VERSION) ==================
export const googleAuth = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return res.status(400).json({ message: "Missing Google access token" });
        }

        // 1️⃣ Get user info from Google API (using access token)
        const googleUser = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        }).then(res => res.json());

        const { sub: googleId, email, name } = googleUser;

        if (!googleId) {
            return res.status(400).json({ message: "Invalid Google token" });
        }

        // 2️⃣ Check if existing Google user in DB
        let user = await User.findOne({ googleId });

        // 3️⃣ Create user if new
        if (!user) {
            user = await User.create({
                email,
                username: name,
                googleId,
                password: "GOOGLE_LOGIN", // dummy password
                maSinhVien: "000000",
            });
        }

        // 4️⃣ Create tokens + cookies
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        return res.status(200).json({
            message: "Google login successful!",
            userData: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                maSinhVien: user.maSinhVien,
            },
        });

    } catch (error) {
        console.error("❌ Google Auth Error:", error);
        res.status(500).json({ message: "Google authentication failed" });
    }
};
