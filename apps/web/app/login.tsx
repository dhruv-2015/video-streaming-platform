"use client";
import { Button } from '@workspace/ui/components/button'
import { signIn } from 'next-auth/react'

const login = () => {
  return (
    <Button size="sm" onClick={() => signIn()}>Login</Button>
  )
}

export default login