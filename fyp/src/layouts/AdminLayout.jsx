import React from 'react'
import AutoRedirector from '../components/AutoDirector'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {
  return (
    <>
    <AutoRedirector roleRequired="admin" />
    <main>
      <Outlet />
    </main>
    </>
  )
}

export default AdminLayout