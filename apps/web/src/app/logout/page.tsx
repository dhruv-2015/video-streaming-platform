"use client"
import React from 'react'
import { signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
const page = () => {
    signOut();
    redirect('/');
  return (
    <></>
  )
}

export default page