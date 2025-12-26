import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(core)/dashboard/users')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(core)/dashboard/users"!</div>
}
