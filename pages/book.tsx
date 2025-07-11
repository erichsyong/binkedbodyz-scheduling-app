import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '../lib/supabase'

type Availability = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
}

export default function Book() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .order('day_of_week', { ascending: true })

    if (error) {
      alert('Failed to load availability: ' + error.message)
    } else {
      setAvailability(data as Availability[])
    }
  }

  async function submitBooking() {
    if (!selectedSlot || !name || !email || !phone) {
      alert('Please fill in all required fields and select a time slot.')
      return
    }

    const today = new Date()
    const currentWeekDay = today.getDay()
    const daysUntilSlot =
      (selectedSlot.day_of_week + 7 - currentWeekDay) % 7 || 7

    const start = new Date(today)
    start.setDate(today.getDate() + daysUntilSlot)
    const [sh, sm] = selectedSlot.start_time.split(':')
    start.setHours(parseInt(sh))
    start.setMinutes(parseInt(sm))
    start.setSeconds(0)

    const end = new Date(start)
    const [eh, em] = selectedSlot.end_time.split(':')
    end.setHours(parseInt(eh))
    end.setMinutes(parseInt(em))

    setLoading(true)
    const { error } = await supabase.from('bookings').insert([
      {
        name,
        email,
        phone,
        instagram,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      },
    ])
    setLoading(false)

    if (error) {
      alert('Booking failed: ' + error.message)
    } else {
      alert('Booking confirmed! 🎉')

      // Google Calendar API call (if logged in with Google)
      if (session?.accessToken) {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: 'New Booking',
            description: `Booked by ${name} (${email})`,
            start: {
              dateTime: start.toISOString(),
              timeZone: 'America/Los_Angeles',
            },
            end: {
              dateTime: end.toISOString(),
              timeZone: 'America/Los_Angeles',
            },
          }),
        })
      }

      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setInstagram('')
      setSelectedSlot(null)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>Book a Time Slot</h1>

      <h3>Select an Available Slot</h3>
      <ul>
        {availability.map((slot) => (
          <li key={slot.id}>
            <label>
              <input
                type="radio"
                name="slot"
                value={slot.id}
                checked={selectedSlot?.id === slot.id}
                onChange={() => setSelectedSlot(slot)}
              />
              {' '}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.day_of_week]}: {slot.start_time}–{slot.end_time}
            </label>
          </li>
        ))}
      </ul>

      <h3>Enter Your Info</h3>
      <div>
        <label>
          Name:*<br />
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Email:*<br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Phone:*<br />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Instagram:<br />
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </label>
      </div>

      <button onClick={submitBooking} disabled={loading}>
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </div>
  )
}
