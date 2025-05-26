import mongoose from "mongoose";

const connectionDB = async () => {
    try {
        let connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`\n MongoDB connected !! DB Host : ${connectionInstance.connection.host}`)
    } catch (error) {
        throw Error("Some issue on Database connection !! Further action required !!")
    }
}

export default connectionDB;