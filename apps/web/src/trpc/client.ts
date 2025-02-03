import { createTRPCReact } from '@trpc/react-query'
import { AppRouter } from '@workspace/trpc'

export const trpc = createTRPCReact<AppRouter>()