import React from 'react'
import { Link } from 'react-router-dom'

const StHistoryPage = () => {
  return (
    <div className="sm:ml-64 pt-24 px-4 sm:px-8">
      <div className="text-3xl">History Page</div>
      <Link to="/inputgenre">
      Go to Input
      </Link>

      <br></br>
      <Link to="/signup">
      Go to sign up
      </Link>
      <br></br>

      <Link to="/signin">
      Go to sign in
      </Link>
      <br></br>

      <Link to="/admin">
      Go to admin dashboard page
      </Link>
      <br></br>

      <Link to="/admin/videoHomePage">
      Go to admin video home page
      </Link>

    </div>
  );
}

export default StHistoryPage