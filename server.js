require('dotenv').config();
const mongoose = require('mongoose');

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt'); 
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies'); 
const Review = require('./Reviews'); 
const trackEventGA4 = require('./analytics_EC');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

// Removed getJSONObjectForMovieRequirement as it's not used

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

router.route('/movies')
  .get(authJwtController.isAuthenticated, async (req, res) => {
      try {
        const movies = await Movie.find();
        return res.json(movies);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to get movie' });
      }
    })
  .post(authJwtController.isAuthenticated, async (req, res) => {
      if (!req.body.title || !req.body.actors || req.body.actors.length === 0) {
        return res.status(400).json({ success: false, message: 'Please include title, genres, actors' });
      }
      try {
        const newMovie = new Movie(req.body);
        await newMovie.save();
        return res.status(201).json({sucess: true, message: 'Movie added sucessfully', movie: newMovie});
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to add movie' });
      }
        
    });
router.route('/movies/:movieId')
    .get(authJwtController.isAuthenticated, async (req, res) => {
      try {
        const { movieId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
          return res.status(400).json({ success: false, message: 'Invalid movie ID format' });
        }
        if (req.query.reviews === 'true') {
          const movieWithReviews = await Movie.aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(req.params.movieId) }
            },
            {
              $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'movieId',
                as: 'reviews'
              }
            }
          ]);

          if (movieWithReviews.length === 0) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
          }

          return res.json({ success: true, movie: movieWithReviews[0] });
        } else {
          const movie = await Movie.findById(req.params.movieId);

          if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
          }

          return res.json({ success: true, movie });
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve movie' });
      }
    })

    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const updatedMovie = await Movie.findByIdAndUpdate(
                req.params.movieId,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedMovie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            return res.json({ success: true, message: 'Movie updated successfully', updatedMovie });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to update movie' });
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const deletedMovie = await Movie.findByIdAndDelete(req.params.movieId);
            if (!deletedMovie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            return res.json({ success: true, message: 'Movie deleted successfully' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to delete movie' });
        }
    });

// POST /reviews
router.post('/reviews', authJwtController.isAuthenticated, async (req, res) => {
  if (!req.body.movieId || !req.body.review || !req.body.rating) {
      return res.status(400).json({ success: false, message: 'Please include movieId, review, and rating' });
  }

  try {
      const movie = await Movie.findById(req.body.movieId);
      if (!movie) {
          return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      const newReview = new Review({
          movieId: req.body.movieId,
          username: req.user.username,
          review: req.body.review,
          rating: req.body.rating
      });

      await newReview.save();
      // Extra Credit: Track the review creation event with Google Analytics
      trackEventGA4(
        movie.title || 'Unknown Movie',
        movie.genre || 'Unknown Genre',
        'POST /reviews'
      ).catch(err => console.error('GA4 track error:', err.message));
      

      return res.status(200).json({ message: 'Review created!' }); 
  } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Failed to create review' });
  }
});

router.get('/test', (req, res) => {
  trackEventGA4('Test Movie', 'Test Genre', '/test')
    .then(() => res.send('Tracked!'))
    .catch(err => res.status(500).send('Failed'));
});


// get all reviews
router.get('/reviews', authJwtController.isAuthenticated, async (req, res) => {
  try {
      const reviews = await Review.find().populate('movieId', 'title'); // Optionally include movie title
      return res.status(200).json({ success: true, reviews });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});
// get specific review for a movie
router.get('/movies/:movieId/reviews/:reviewId', authJwtController.isAuthenticated, async (req, res) => {
  try {
      const review = await Review.findOne({
          _id: req.params.reviewId,
          movieId: req.params.movieId
      }).populate('movieId', 'title');

      if (!review) {
          return res.status(404).json({ success: false, message: 'Review not found for this movie' });
      }

      return res.status(200).json({ success: true, review });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve review' });
  }
});
// optional delete review
router.route('/movies/:movieId/reviews/:reviewId')
    .delete(authJwtController.isAuthenticated, async (req, res) => {
      try {
        const review = await Review.findOneAndDelete({
          _id: req.params.reviewId,
          movieId: req.params.movieId
        });
  
        if (!review) {
          return res.status(404).json({ success: false, message: 'Review not found' });
        }
  
        return res.json({ success: true, message: 'Review deleted successfully' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to delete review' });
      }
    });
  
app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only