"use client"
import React from 'react'
import {useRouter} from "next/router"
import { signIn } from 'next-auth/react'

const Page = async () => {
    signIn("google", {
        redirectTo: "/",
    });
  return (
    <></>
  )
}

export default Page