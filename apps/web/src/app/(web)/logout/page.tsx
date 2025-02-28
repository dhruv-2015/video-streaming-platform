"use client"
import React, { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
const page = async () => {
  const {push} = useRouter()
    useEffect(() => {
      signOut().then(() =>push('/'));
    },[])
  return (
    <></>
  )
}

export default page