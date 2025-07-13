import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSession } from 'next-auth/react'

type Availability = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
}

export default function Admin() {
  const { data: session } = useSession()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      },
    }
  )

  const [availability, setAvailability] = useState<Availability[]>([])
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  useEffect(() => {
    if (session?.accessToken) fetchAvailability()
  }, [session])

  async function fetchAvailability() {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
    } else {
      setAvailability(data as Availability[])
    }
  }

  async function addAvailability() {
    if (!startTime || !endTime) {
      alert('Please enter start and end time')
      return
    }

    const { error } = await supabase.from('availability').insert([
      {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      },
    ])

    if (error) {
      alert('Error adding availability: ' + error.message)
    } else {
      setStartTime('09:00')
      setEndTime('17:00')
      fetchAvailability()
    }
  }

  async function deleteAvailability(id: number) {
    const { error } = await supabase.from('availability').delete().eq('id', id)
    if (error) {
      alert('Error deleting availability: ' + error.message)
    } else {
      fetchAvailability()
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Manage Availability</h1>

      <div>
        <label>
          Day of Week:
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
          >
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Start Time:
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          End Time:
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </div>

      <button onClick={addAvailability}>Add Availability</button>

      <h2>Existing Availability</h2>
      <ul>
        {availability.map((slot) => (
          <li key={slot.id}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.day_of_week]}: {slot.start_time} - {slot.end_time}{' '}
            <button onClick={() => deleteAvailability(slot.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
