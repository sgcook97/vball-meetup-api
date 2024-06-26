import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import validateUsernameOrEmail from '../middlewares/verifySignup';

const authRouter: Router = express.Router();

// Helper function to generate tokens
const generateTokens = (userId: string, email: string) => {
    const accessToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { userId, email },
        process.env.JWT_REFRESH_SECRET_KEY as string,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Register endpoint
authRouter.post('/register', validateUsernameOrEmail, async (req: Request, res: Response) => {
    const { username, email, password, skillLevel, favoritePlaces } = req.body;

    try {
        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // register the user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            skillLevel,
            favoritePlaces
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
authRouter.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // find user by email
        const user = await User.findOne({ email });

        // if user not found, return an error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // check if password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);

        // if passwords do not match, return an error
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

        res.status(200).json({ 
            accessToken,
            refreshToken,
            userId: user._id,
            email: user.email,
            username: user.username,
            skillLevel: user.skillLevel,
            favoritePlaces: user.favoritePlaces,
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token endpoint
authRouter.post('/refresh-token', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY as string) as { userId: string, email: string };

        const { userId, email } = decoded;

        // Generate new tokens
        const newTokens = generateTokens(userId, email);

        res.status(200).json(newTokens);
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

// Logout endpoint
authRouter.post('/logout', async (req: Request, res: Response) => {
    return res.status(200).json({ message: 'Logout successful' }); 
});

export default authRouter;
