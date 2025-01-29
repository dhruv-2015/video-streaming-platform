"use client";
import { Button } from '@workspace/ui/components/button'
import { signOut } from 'next-auth/react'

const SignOut = () => {
  return (
    <Button size="sm" onClick={() => signOut()}>SignOut</Button>
  )
}

export default SignOut