'use client'
import React from 'react'
import withAuth from '../../utils/withAuth'
import Admin from "../../components/layout/Admin";
function page() {
  return (
    <Admin>
        <div>
            <h1>Documents</h1>
        </div>
    </Admin>
  )
}
export default withAuth(page)
