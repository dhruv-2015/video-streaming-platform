"use client";
import { Button } from '@workspace/ui/components/button'
import { User } from 'lucide-react'
import React from 'react'
import {signIn} from "next-auth/react"

const Login = () => {
  return (
    <Button onClick={() => signIn("google")} variant="ghost">
      <User />
    </Button>
  )
}

export default Login