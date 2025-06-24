const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const passwordRoutes = require('./routes/passwordRoute');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Primary connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use('/api/users', authRoutes); //  This makes /users/by-username work
app.use("/api/password", require("./routes/passwordRoute"));
app.use("/api/preference", require("./routes/genreRoute"));
app.use("/api/usersRoutes", require("./routes/usersRoutes"));
app.use("/api/profile", require("./routes/profile"));
app.use("/uploads", express.static("uploads")); 


app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});