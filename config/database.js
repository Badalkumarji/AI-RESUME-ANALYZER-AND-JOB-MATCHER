const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Atlas Connected Successfully');
  } catch (error) {
    console.error('Database Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
