import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(core)/back-office/chemical-materials/$chemicalMaterial/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/(core)/back-office/chemical-materials/$chemicalMaterial/edit"!
    </div>
  )
}
