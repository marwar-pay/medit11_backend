import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectionDB from "./db/index.js";
import userRouter from "./routes/user.routes.js";
import matchRouter from "./routes/match.route.js";
import leagueRouter from "./routes/league.route.js";
import squadRouter from "./routes/squad.route.js";
import contestRouter from "./routes/contest.route.js";
import fantasyTeamRouter from "./routes/fantasyTeam.route.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/match", matchRouter);
app.use("/api/v1/squad", squadRouter);
app.use("/api/v1/league", leagueRouter);
app.use("/api/v1/contests", contestRouter);
app.use("/api/v1/fantasy-team", fantasyTeamRouter);

connectionDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((err) => {
    console.log("Database connection failed", err);
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    // process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.log(err.name, err.message);
    console.log("uncaughtException occurred ! Shutting Down Server !");
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    console.log("unhandledRejection occurred ! Shutting Down Server !");
    process.exit(1);
});