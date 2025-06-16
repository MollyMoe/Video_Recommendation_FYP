const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const genreRoutes = require('./routes/genreRoutes');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Primary connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Main DB connected"))
.catch((err) => console.error(" Main DB error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/preference", require("./routes/genreRoutes"));
app.use('/api/users', authRoutes); //  This makes /users/by-username work
 



app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});