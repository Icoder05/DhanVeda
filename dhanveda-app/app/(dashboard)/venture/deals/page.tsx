import VentureIQApp from '@/components/venture/VentureIQApp'

export const metadata = { title: 'Acquisition & Partnership — ArthaSift' }

export default function VentureDealsPage() {
  return (
    <div className="dv-main">
      <VentureIQApp initialView="inorganic" />
    </div>
  )
}
