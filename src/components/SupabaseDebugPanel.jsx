import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ui from './ui/ui.module.css'

export default function SupabaseDebugPanel() {
  const [results, setResults] = useState(null)
  const [testing, setTesting] = useState(false)

  async function runDiagnostics() {
    setTesting(true)
    const diagnostics = {
      clientInitialized: !!supabase,
      session: null,
      programs: null,
      sounds: null,
      errors: []
    }

    try {
      if (!supabase) {
        diagnostics.errors.push('Supabase client not initialized')
        setResults(diagnostics)
        setTesting(false)
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        diagnostics.errors.push(`Session error: ${sessionError.message}`)
      } else if (!session) {
        diagnostics.errors.push('No active session - user not authenticated')
      } else {
        diagnostics.session = {
          email: session.user.email,
          role: session.user.role,
          authenticated: true
        }
      }

      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .limit(5)
      
      if (programsError) {
        diagnostics.errors.push(`Programs: ${programsError.message}`)
        diagnostics.programs = { error: programsError.message, code: programsError.code }
      } else {
        diagnostics.programs = { count: programs?.length || 0, sample: programs }
      }

      const { data: sounds, error: soundsError } = await supabase
        .from('sounds')
        .select('*')
        .limit(5)
      
      if (soundsError) {
        diagnostics.errors.push(`Sounds: ${soundsError.message}`)
        diagnostics.sounds = { error: soundsError.message, code: soundsError.code }
      } else {
        diagnostics.sounds = { count: sounds?.length || 0, sample: sounds }
      }

    } catch (err) {
      diagnostics.errors.push(`Unexpected error: ${err.message}`)
    }

    setResults(diagnostics)
    setTesting(false)
  }

  async function testCreateProgram() {
    setTesting(true)
    const testResult = { success: false, error: null, data: null }

    try {
      if (!supabase) {
        testResult.error = 'Supabase client not initialized'
        setResults({ ...results, testCreate: testResult })
        setTesting(false)
        return
      }

      const testProgram = {
        name: `Test ${Date.now()}`,
        description: 'Test program'
      }

      const { data, error } = await supabase
        .from('programs')
        .insert(testProgram)
        .select()
        .single()
      
      if (error) {
        testResult.error = error.message
        testResult.code = error.code
      } else {
        testResult.success = true
        testResult.data = data

        await supabase.from('programs').delete().eq('id', data.id)
      }

    } catch (err) {
      testResult.error = err.message
    }

    setResults({ ...results, testCreate: testResult })
    setTesting(false)
  }

  return (
    <div className={ui.card} style={{ marginBottom: 20, backgroundColor: '#fff3cd' }}>
      <div className={ui.cardTitle}>🔧 Supabase Debug Panel</div>
      <div className={ui.muted} style={{ marginBottom: 10 }}>
        Panel de diagnóstico para verificar la conexión con Supabase
      </div>

      <div className={ui.row} style={{ gap: 8, marginBottom: 10 }}>
        <button 
          className={ui.button} 
          onClick={runDiagnostics}
          disabled={testing}
        >
          {testing ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </button>
        <button 
          className={ui.button} 
          onClick={testCreateProgram}
          disabled={testing}
        >
          {testing ? 'Probando...' : 'Probar Crear Programa'}
        </button>
        <button 
          className={ui.button} 
          onClick={() => setResults(null)}
          disabled={!results}
        >
          Limpiar
        </button>
      </div>

      {results && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: 12, 
          borderRadius: 4,
          fontSize: 13,
          fontFamily: 'monospace',
          maxHeight: 400,
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className={ui.muted} style={{ marginTop: 10, fontSize: 12 }}>
        💡 Abre la consola del navegador (F12) para ver logs detallados
      </div>
    </div>
  )
}
