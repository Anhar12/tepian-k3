import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(core)/dashboard/clusters/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(core)/dashboard/clusters/create"!</div>
}
