import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { jsPDF } from 'jspdf'
import { Timestamp } from 'firebase/firestore'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import './App.css'

export type FormState = {
  nombrePaciente: string
  edad: string
  domicilio: string
  fechaEvaluacion: string
  // Antecedentes
  app: string
  aqx: string
  medicamentos: string
  afracturas: string
  lesionesRelacionadas: string
  alteracionesCognitivas: string
  ayudasBiomecanicas: string
  // Examen Físico
  piel: string
  // Goniometría
  goniometria: string
  // Examen Manual Muscular
  examManualMuscular: string
  // Dolor
  dolorLocalizacion: string
  dolorTipo: string
  dolorAumento: string
  // Valoración Funcional
  tugTiempo: string
  tugObservaciones: string
  marcha4minutos: string
  marchaObservaciones: string
  chairStandResultado: string
  chairStandObservaciones: string
  functionalReach: string
  equilibrio: string
  // Caídas
  tuvoCaidas: string
  caidasDetalle: string
  // Plan
  movilidadGlobal: string
  riesgoCaidas: string
  objetivosTerapia: string
  sesionesSemana: string
  duracionSesion: string
  intervenciones: string[]
  ejerciciosHoy: string
  recomendaciones: string
  // Nota de Evolución
  fechaEvolucion: string
  pielEvolucion: string
  goniometriaEvolucion: string
  examManualMuscularEvolucion: string
  dolorLocalizacionEvolucion: string
  dolorTipoEvolucion: string
  dolorAumentoEvolucion: string
  secuelasQuePeristen: string
  cumplimientoObjetivos: string
  recomendacionesEvolucion: string
}

type SavedForm = {
  id: string
  data: Partial<FormState>
  updatedAt: string
}

const initialForm: FormState = {
  nombrePaciente: '',
  edad: '',
  domicilio: '',
  fechaEvaluacion: '',
  // Antecedentes
  app: '',
  aqx: '',
  medicamentos: '',
  afracturas: '',
  lesionesRelacionadas: '',
  alteracionesCognitivas: '',
  ayudasBiomecanicas: '',
  // Examen Físico
  piel: '',
  // Goniometría
  goniometria: '',
  // Examen Manual Muscular
  examManualMuscular: '',
  // Dolor
  dolorLocalizacion: '',
  dolorTipo: '',
  dolorAumento: '',
  // Valoración Funcional
  tugTiempo: '',
  tugObservaciones: '',
  marcha4minutos: '',
  marchaObservaciones: '',
  chairStandResultado: '',
  chairStandObservaciones: '',
  functionalReach: '',
  equilibrio: '',
  // Caídas
  tuvoCaidas: '',
  caidasDetalle: '',
  // Plan
  movilidadGlobal: '',
  riesgoCaidas: '',
  objetivosTerapia: '',
  sesionesSemana: '',
  duracionSesion: '',
  intervenciones: [],
  ejerciciosHoy: '',
  recomendaciones: '',
  // Nota de Evolución
  fechaEvolucion: '',
  pielEvolucion: '',
  goniometriaEvolucion: '',
  examManualMuscularEvolucion: '',
  dolorLocalizacionEvolucion: '',
  dolorTipoEvolucion: '',
  dolorAumentoEvolucion: '',
  secuelasQuePeristen: '',
  cumplimientoObjetivos: '',
  recomendacionesEvolucion: '',
}

type LegacyFormData = Partial<FormState> & {
  dniHistoria?: string
}

const interventionOptions = [
  'Reentrenamiento de marcha',
  'Equilibrio',
  'Fuerza MMII',
  'Transferencias',
  'Educación sobre caídas',
  'Adaptación del hogar',
]

const professionalProfile = {
  nombre: 'Irene Duarte Guzmán',
  telefono: '8699-3166',
  email: 'irene.duarte@hotmail.com',
  codigo: 'CTCR TF-2417',
}

const cloneForm = (form: FormState): FormState => ({
  ...form,
  intervenciones: [...form.intervenciones],
})

const hydrateForm = (raw?: LegacyFormData): FormState => {
  const safe = raw ?? {}

  return {
    ...initialForm,
    ...safe,
  }
}

const pdfMonthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const formatDateForPdf = (value: string | Date) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return ''
    }

    return `${value.getDate()} ${pdfMonthNames[value.getMonth()]} ${value.getFullYear()}`
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return ''
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const monthIndex = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const parsedDate = new Date(year, monthIndex, day)

    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day
    ) {
      return `${day} ${pdfMonthNames[monthIndex]} ${year}`
    }
  }

  const slashMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const day = Number(slashMatch[1])
    const monthIndex = Number(slashMatch[2]) - 1
    const year = Number(slashMatch[3])
    const parsedDate = new Date(year, monthIndex, day)

    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day
    ) {
      return `${day} ${pdfMonthNames[monthIndex]} ${year}`
    }
  }

  const fallbackDate = new Date(trimmedValue)
  if (Number.isNaN(fallbackDate.getTime())) {
    return trimmedValue
  }

  return `${fallbackDate.getDate()} ${pdfMonthNames[fallbackDate.getMonth()]} ${fallbackDate.getFullYear()}`
}

function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [savedForms, setSavedForms] = useState<SavedForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [loadedFormId, setLoadedFormId] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaveMessageFading, setIsSaveMessageFading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const today = useMemo(() => formatDateForPdf(new Date()), [])
  const logoPath = `${import.meta.env.BASE_URL}logo.png`
  const isSaveError =
    saveMessage.startsWith('Error') ||
    saveMessage.startsWith('Para guardar') ||
    saveMessage.startsWith('No fue posible')

  useEffect(() => {
    if (!saveMessage) {
      setIsSaveMessageFading(false)
      return
    }

    setIsSaveMessageFading(false)

    const fadeTimeoutId = window.setTimeout(() => {
      setIsSaveMessageFading(true)
    }, 5000)

    const clearTimeoutId = window.setTimeout(() => {
      setSaveMessage('')
      setIsSaveMessageFading(false)
    }, 5500)

    return () => {
      window.clearTimeout(fadeTimeoutId)
      window.clearTimeout(clearTimeoutId)
    }
  }, [saveMessage])

  // Firebase Auth + Load Forms
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUserId(currentUser.uid)
          // Load forms from Firebase
          const { loadUserForms } = await import('./firebaseService')
          const firebaseForms = await loadUserForms(currentUser.uid)
          const convertedForms = firebaseForms.map((item) => ({
            id: item.id,
            data: item.data,
            updatedAt: item.updatedAt instanceof Timestamp
              ? item.updatedAt.toDate().toISOString()
              : String(item.updatedAt),
          }))
          setSavedForms(convertedForms)
          setIsSigningIn(false)
        } else {
          setSavedForms([])
          setUserId(null)
          setIsSigningIn(false)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setSaveMessage('Error al conectar con la base de datos.')
        setIsSigningIn(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword)
    } catch {
      setLoginError('Correo o contraseña incorrectos.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleInterventionToggle = (value: string) => {
    setForm((prev) => {
      const exists = prev.intervenciones.includes(value)
      return {
        ...prev,
        intervenciones: exists
          ? prev.intervenciones.filter((item) => item !== value)
          : [...prev.intervenciones, value],
      }
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!userId) {
      setSaveMessage('Por favor, espera a que se cargue la aplicación.')
      return
    }

    const nombrePaciente = form.nombrePaciente.trim()
    const domicilio = form.domicilio.trim()

    if (!nombrePaciente || !domicilio) {
      setSaveMessage('Para guardar, completa nombre y domicilio del paciente.')
      return
    }

    setIsLoading(true)
    try {
      const { saveFormToDatabase } = await import('./firebaseService')
      const formId = await saveFormToDatabase(
        userId,
        nombrePaciente,
        domicilio,
        cloneForm({ ...form, nombrePaciente, domicilio }),
      )

      const now = new Date().toISOString()
      const entry: SavedForm = {
        id: formId,
        data: cloneForm({ ...form, nombrePaciente, domicilio }),
        updatedAt: now,
      }

      const next = [entry, ...savedForms.filter((item) => item.id !== formId)]
      setSavedForms(next)
      setSelectedFormId(formId)
      setLoadedFormId(formId)
      setSaveMessage('Formulario guardado en la nube. Ya puedes generar el PDF.')
      setSubmitted(true)
    } catch (error) {
      console.error('Error saving form:', error)
      setSaveMessage('Error al guardar el formulario en la base de datos.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadSavedForm = (formId: string) => {
    if (!formId) {
      setForm(cloneForm(initialForm))
      setSubmitted(false)
      setSaveMessage('')
      return
    }

    const selectedForm = savedForms.find((item) => item.id === formId)
    if (!selectedForm) {
      return
    }

    setForm(cloneForm(hydrateForm(selectedForm.data)))
    setSelectedFormId(formId)
    setLoadedFormId(formId)
    setSubmitted(true)
    setSaveMessage(`Formulario cargado: ${formId}`)
  }

  const handleNewForm = () => {
    setForm(cloneForm(initialForm))
    setSelectedFormId('')
    setLoadedFormId('')
    setSubmitted(false)
    setSaveMessage('Nuevo formulario listo para completar.')
  }

  const handleDeleteLoadedForm = async () => {
    if (!loadedFormId) {
      return
    }

    const confirmed = window.confirm(
      `¿Deseas eliminar el formulario cargado?\n\n${loadedFormId}\n\nEsta acción no se puede deshacer.`,
    )

    if (!confirmed) {
      return
    }

    setIsLoading(true)
    try {
      const { deleteFormFromDatabase } = await import('./firebaseService')
      await deleteFormFromDatabase(loadedFormId)
      const next = savedForms.filter((item) => item.id !== loadedFormId)
      setSavedForms(next)
      setForm(cloneForm(initialForm))
      setSelectedFormId('')
      setLoadedFormId('')
      setSubmitted(false)
      setSaveMessage('Formulario eliminado correctamente.')
    } catch (error) {
      console.error('Error deleting form:', error)
      setSaveMessage('Error al eliminar el formulario.')
    } finally {
      setIsLoading(false)
    }
  }

  const getLogoDataUrl = async () => {
    const response = await fetch(logoPath)
    if (!response.ok) {
      return null
    }
    const logoBlob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
          return
        }
        reject(new Error('No se pudo leer logo.png'))
      }
      reader.onerror = () => reject(new Error('No se pudo convertir logo.png'))
      reader.readAsDataURL(logoBlob)
    })
  }

  const generatePdf = async () => {
    const doc = new jsPDF({ orientation: 'portrait' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const leftMargin = 15
    const rightMargin = pageWidth - leftMargin
    const topMarginFirstPage = 62
    const topMarginNextPages = 16
    const bottomMargin = 6
    const contentBottom = pageHeight - bottomMargin
    const twoColumnGap = 10
    const threeColumnGap = 7
    const valueIndent = 1.5
    const titleFontSize = 13
    const sectionFontSize = 12
    const labelFontSize = 10
    const valueFontSize = 10.5
    const metaFontSize = 10.5
    const sectionLineHeight = 6.5
    const bodyLineHeight = 5.2
    const blockSpacing = 2

    const sections = [
      {
        title: '1. Datos del paciente',
        rows: [
          { label: 'Nombre', value: form.nombrePaciente },
          { label: 'Edad', value: form.edad },
          { label: 'Domicilio', value: form.domicilio },
          { label: 'Fecha de evaluación', value: formatDateForPdf(form.fechaEvaluacion) },
        ],
      },
      {
        title: '2. Antecedentes',
        rows: [
          { label: 'APP', value: form.app },
          { label: 'AQx', value: form.aqx },
          { label: 'Medicamentos', value: form.medicamentos },
          { label: 'A Fracturas', value: form.afracturas },
          { label: 'Lesiones Relacionadas', value: form.lesionesRelacionadas },
          { label: 'Alteraciones Cognitivas/Sensoriales', value: form.alteracionesCognitivas },
          { label: 'Ayudas Biomecánicas', value: form.ayudasBiomecanicas },
        ],
      },
      {
        title: '3. Examen Físico',
        rows: [
          { label: 'Piel', value: form.piel },
        ],
      },
      {
        title: '4. Goniometría',
        rows: [
          { label: 'Goniometría', value: form.goniometria },
        ],
      },
      {
        title: '5. Examen Manual Muscular',
        rows: [
          { label: 'Examen Manual Muscular', value: form.examManualMuscular },
        ],
      },
      {
        title: '6. Dolor',
        rows: [
          { label: 'Localización', value: form.dolorLocalizacion },
          { label: 'Tipo', value: form.dolorTipo },
          { label: 'Aumento', value: form.dolorAumento },
        ],
      },
      {
        title: '7. Valoración Funcional',
        rows: [
          { label: 'TUG Tiempo (s)', value: form.tugTiempo },
          { label: 'TUG Observaciones', value: form.tugObservaciones },
          { label: 'Marcha 4 minutos', value: form.marcha4minutos },
          { label: 'Marcha Observaciones', value: form.marchaObservaciones },
          { label: 'Chair Stand Resultado', value: form.chairStandResultado },
          { label: 'Chair Stand Observaciones', value: form.chairStandObservaciones },
          { label: 'Functional Reach (cm)', value: form.functionalReach },
          { label: 'Equilibrio', value: form.equilibrio },
        ],
      },
      {
        title: '8. Caídas',
        rows: [
          { label: '¿Tuvo caídas?', value: form.tuvoCaidas },
          { label: 'Detalle de las caídas', value: form.caidasDetalle },
        ],
      },
      {
        title: '9. Plan',
        rows: [
          { label: 'Movilidad Global', value: form.movilidadGlobal },
          { label: 'Riesgo de Caídas', value: form.riesgoCaidas },
          { label: 'Objetivos de Terapia Física', value: form.objetivosTerapia },
          { label: 'Sesiones por semana', value: form.sesionesSemana },
          { label: 'Duración por sesión (min)', value: form.duracionSesion },
          {
            label: 'Intervenciones propuestas',
            value: form.intervenciones.join(', '),
          },
          { label: 'Ejercicios indicados hoy', value: form.ejerciciosHoy },
          { label: 'Recomendaciones', value: form.recomendaciones },
        ],
      },
      {
        title: '10. Nota de Evolución',
        rows: [
          { label: 'Fecha', value: formatDateForPdf(form.fechaEvolucion) },
          { label: 'Piel', value: form.pielEvolucion },
          { label: 'Goniometría', value: form.goniometriaEvolucion },
          { label: 'Examen Manual Muscular', value: form.examManualMuscularEvolucion },
          { label: 'Dolor - Localización', value: form.dolorLocalizacionEvolucion },
          { label: 'Dolor - Tipo', value: form.dolorTipoEvolucion },
          { label: 'Dolor - Aumento', value: form.dolorAumentoEvolucion },
          { label: 'Secuelas que Persisten', value: form.secuelasQuePeristen },
          { label: 'Cumplimiento de Objetivos de Terapia Física', value: form.cumplimientoObjetivos },
          { label: 'Recomendaciones', value: form.recomendacionesEvolucion },
        ],
      },
    ]

    const getColumnWidth = (count: number, gap: number) =>
      (pageWidth - leftMargin * 2 - gap * (count - 1)) / count

    const estimatePagesForLayout = (count: number, gap: number) => {
      const estimatedColumnWidth = getColumnWidth(count, gap)
      let simulatedCursorY = topMarginFirstPage
      let simulatedColumn = 0
      let simulatedTopMargin = topMarginFirstPage
      let simulatedPages = 1

      const moveToNextEstimatedArea = () => {
        if (simulatedColumn < count - 1) {
          simulatedColumn += 1
          simulatedCursorY = simulatedTopMargin
          return
        }

        simulatedPages += 1
        simulatedColumn = 0
        simulatedTopMargin = topMarginNextPages
        simulatedCursorY = simulatedTopMargin
      }

      const ensureEstimatedSpace = (requiredHeight: number) => {
        if (simulatedCursorY + requiredHeight > contentBottom) {
          moveToNextEstimatedArea()
        }
      }

      const getEstimatedRowBlockHeight = (label: string, value: string) => {
        const labelLines = doc.splitTextToSize(label.trim(), estimatedColumnWidth)
        const valueLines = doc.splitTextToSize(value.trim(), estimatedColumnWidth - valueIndent)

        return labelLines.length * bodyLineHeight + valueLines.length * bodyLineHeight + blockSpacing
      }

      sections.forEach((section) => {
        const rowsWithValue = section.rows.filter((row) => row.value.trim().length > 0)
        if (rowsWithValue.length === 0) {
          return
        }

        const titleLines = doc.splitTextToSize(section.title, estimatedColumnWidth)
        const titleBlockHeight = titleLines.length * sectionLineHeight + 7
        const firstRow = rowsWithValue[0]
        const keepWithNextHeight = titleBlockHeight + getEstimatedRowBlockHeight(firstRow.label, firstRow.value)

        ensureEstimatedSpace(keepWithNextHeight)
        simulatedCursorY += titleLines.length * sectionLineHeight + 3

        rowsWithValue.forEach((row) => {
          const blockHeight = getEstimatedRowBlockHeight(row.label, row.value)

          ensureEstimatedSpace(blockHeight)
          simulatedCursorY += blockHeight
        })

        simulatedCursorY += 4
      })

      return simulatedPages
    }

    const useTwoColumns = estimatePagesForLayout(2, twoColumnGap) === 1
    const columnCount = useTwoColumns ? 2 : 3
    const columnGap = useTwoColumns ? twoColumnGap : threeColumnGap
    const columnWidth = getColumnWidth(columnCount, columnGap)

    let cursorY = 8
    let currentColumn = 0
    let currentTopMargin = topMarginFirstPage

    const getColumnX = () => leftMargin + currentColumn * (columnWidth + columnGap)

    const moveToNextFlowArea = () => {
      if (currentColumn < columnCount - 1) {
        currentColumn += 1
        cursorY = currentTopMargin
        return
      }

      doc.addPage()
      currentColumn = 0
      currentTopMargin = topMarginNextPages
      cursorY = currentTopMargin
    }

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY + requiredHeight > contentBottom) {
        moveToNextFlowArea()
      }
    }

    const getRowBlockHeight = (label: string, value: string) => {
      const labelLines = doc.splitTextToSize(label.trim(), columnWidth)
      const valueLines = doc.splitTextToSize(value.trim(), columnWidth - valueIndent)

      return labelLines.length * bodyLineHeight + valueLines.length * bodyLineHeight + blockSpacing
    }

    const writeLabeledBlock = (label: string, value: string) => {
      const trimmedLabel = label.trim()
      const trimmedValue = value.trim()
      if (!trimmedValue) {
        return
      }

      const labelLines = doc.splitTextToSize(trimmedLabel, columnWidth)
      const valueLines = doc.splitTextToSize(trimmedValue, columnWidth - valueIndent)
      const blockHeight =
        labelLines.length * bodyLineHeight + valueLines.length * bodyLineHeight + blockSpacing

      ensureSpace(blockHeight)

      const columnX = getColumnX()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(labelFontSize)
      doc.text(labelLines, columnX, cursorY)
      cursorY += labelLines.length * bodyLineHeight

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(valueFontSize)
      doc.text(valueLines, columnX + valueIndent, cursorY)
      cursorY += valueLines.length * bodyLineHeight + blockSpacing
    }

    const logoDataUrl = await getLogoDataUrl()
    if (logoDataUrl) {
      const maxLogoWidth = 46
      const maxLogoHeight = 34
      const logoProps = doc.getImageProperties(logoDataUrl)
      const widthRatio = maxLogoWidth / logoProps.width
      const heightRatio = maxLogoHeight / logoProps.height
      const scale = Math.min(widthRatio, heightRatio)
      const logoWidth = logoProps.width * scale
      const logoHeight = logoProps.height * scale

      doc.addImage(logoDataUrl, 'PNG', leftMargin, cursorY, logoWidth, logoHeight)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(titleFontSize)
    doc.text('Informe de Valoración Funcional', rightMargin, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(metaFontSize)
    doc.text(`Fecha de emisión: ${today}`, rightMargin, 20, { align: 'right' })
    doc.text(`Fisioterapeuta: ${professionalProfile.nombre}`, rightMargin, 26, { align: 'right' })
    doc.text(`Teléfono: ${professionalProfile.telefono}`, rightMargin, 32, { align: 'right' })
    doc.text(`Email: ${professionalProfile.email}`, rightMargin, 38, { align: 'right' })
    doc.text(`Código profesional: ${professionalProfile.codigo}`, rightMargin, 44, { align: 'right' })
    doc.setLineWidth(0.4)
    doc.line(leftMargin, 54, rightMargin, 54)

    cursorY = currentTopMargin

    const writeSection = (title: string, rows: Array<{ label: string; value: string }>) => {
      const rowsWithValue = rows.filter((row) => row.value.trim().length > 0)
      if (rowsWithValue.length === 0) {
        return
      }

      const titleLines = doc.splitTextToSize(title, columnWidth)
      const titleBlockHeight = titleLines.length * sectionLineHeight + 7
      const firstRow = rowsWithValue[0]
      const keepWithNextHeight = titleBlockHeight + getRowBlockHeight(firstRow.label, firstRow.value)

      ensureSpace(keepWithNextHeight)

      const columnX = getColumnX()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sectionFontSize)
      doc.text(titleLines, columnX, cursorY)
      cursorY += titleLines.length * sectionLineHeight
      cursorY += 3

      rowsWithValue.forEach((row) => {
        writeLabeledBlock(row.label, row.value)
      })

      cursorY += 4
    }

    sections.forEach((section) => {
      writeSection(section.title, section.rows)
    })

    doc.save(
      `informe-valoracion-${form.nombrePaciente
        .toLowerCase()
        .replaceAll(' ', '-') || 'paciente'}.pdf`,
    )
  }

  if (isSigningIn) {
    return (
      <main className="app-shell">
        <div className="loading-overlay">
          <p>Cargando aplicación...</p>
        </div>
      </main>
    )
  }

  if (!userId) {
    return (
      <main className="login-screen">
        <div className="login-card">
          <div className="login-logo-badge">
            <img src={logoPath} alt="Logo del centro" className="brand-logo" />
          </div>
          <h1>Formulario de Valoración Funcional</h1>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Correo electrónico
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="brand-header">
        <div className="brand-logo-badge">
          <img src={logoPath} alt="Logo del centro" className="brand-logo" />
        </div>
        <div>
          <h1>Formulario de Valoración Funcional</h1>
        </div>
      </header>

      <section className="panel saved-forms-panel">
        <h2>Formularios guardados</h2>
        <div className="saved-forms-row">
          <label className="saved-forms-field">
            Seleccionar formulario existente
            <select value={selectedFormId} onChange={(event) => setSelectedFormId(event.target.value)}>
              <option value="">Nuevo formulario</option>
              {savedForms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.data.nombrePaciente?.trim() || item.id}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => handleLoadSavedForm(selectedFormId)} disabled={!selectedFormId}>
            Cargar formulario
          </button>
          <button type="button" onClick={handleNewForm}>
            Nuevo formulario
          </button>
          <button type="button" onClick={handleDeleteLoadedForm} disabled={!loadedFormId || isLoading} className="btn-danger">
            Eliminar formulario
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="form-layout">
        <section className="panel">
          <h2>Datos del paciente</h2>
          <div className="grid two-cols">
            <label>
              Nombre
              <input name="nombrePaciente" value={form.nombrePaciente} onChange={handleChange} />
            </label>
            <label>
              Edad
              <input name="edad" value={form.edad} onChange={handleChange} />
            </label>
            <label>
              Domicilio
              <input name="domicilio" value={form.domicilio} onChange={handleChange} />
            </label>
            <label>
              Fecha evaluación
              <input type="date" name="fechaEvaluacion" value={form.fechaEvaluacion} onChange={handleChange} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Antecedentes</h2>
          <div className="grid two-cols">
            <label>
              APP
              <input name="app" value={form.app} onChange={handleChange} />
            </label>
            <label>
              AQx
              <input name="aqx" value={form.aqx} onChange={handleChange} />
            </label>
            <label>
              Medicamentos
              <input name="medicamentos" value={form.medicamentos} onChange={handleChange} />
            </label>
            <label>
              A Fracturas
              <input name="afracturas" value={form.afracturas} onChange={handleChange} />
            </label>
            <label>
              Lesiones Relacionadas
              <input name="lesionesRelacionadas" value={form.lesionesRelacionadas} onChange={handleChange} />
            </label>
            <label>
              Alteraciones Cognitivas/Sensoriales
              <input name="alteracionesCognitivas" value={form.alteracionesCognitivas} onChange={handleChange} />
            </label>
            <label>
              Ayudas Biomecánicas
              <input name="ayudasBiomecanicas" value={form.ayudasBiomecanicas} onChange={handleChange} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Examen Físico</h2>

          <label>
            Piel
            <textarea name="piel" value={form.piel} onChange={handleChange} rows={2} />
          </label>

          <label>
            Goniometría
            <textarea name="goniometria" value={form.goniometria} onChange={handleChange} rows={2} />
          </label>

          <label>
            Examen Manual Muscular
            <textarea name="examManualMuscular" value={form.examManualMuscular} onChange={handleChange} rows={2} />
          </label>

          <div className="grid two-cols">
            <label>
              Localización
              <input name="dolorLocalizacion" value={form.dolorLocalizacion} onChange={handleChange} />
            </label>
            <label>
              Tipo
              <input name="dolorTipo" value={form.dolorTipo} onChange={handleChange} />
            </label>
            <label>
              Aumento
              <input name="dolorAumento" value={form.dolorAumento} onChange={handleChange} />
            </label>
          </div>

          <div className="grid two-cols">
            <label>
              TUG Tiempo (s)
              <input name="tugTiempo" value={form.tugTiempo} onChange={handleChange} />
            </label>
            <label>
              TUG Observaciones
              <input name="tugObservaciones" value={form.tugObservaciones} onChange={handleChange} />
            </label>
            <label>
              Marcha 4 minutos
              <input name="marcha4minutos" value={form.marcha4minutos} onChange={handleChange} />
            </label>
            <label>
              Marcha Observaciones
              <input name="marchaObservaciones" value={form.marchaObservaciones} onChange={handleChange} />
            </label>
            <label>
              Chair Stand Resultado
              <input name="chairStandResultado" value={form.chairStandResultado} onChange={handleChange} />
            </label>
            <label>
              Chair Stand Observaciones
              <input name="chairStandObservaciones" value={form.chairStandObservaciones} onChange={handleChange} />
            </label>
            <label>
              Functional Reach (cm)
              <input name="functionalReach" value={form.functionalReach} onChange={handleChange} />
            </label>
            <label>
              Equilibrio
              <input name="equilibrio" value={form.equilibrio} onChange={handleChange} />
            </label>
          </div>

          <label>
            ¿Tuvo caídas?
            <select name="tuvoCaidas" value={form.tuvoCaidas} onChange={handleChange}>
              <option value="">Seleccionar</option>
              <option>Sí</option>
              <option>No</option>
            </select>
          </label>
          <label>
            Detalle de las caídas
            <textarea name="caidasDetalle" value={form.caidasDetalle} onChange={handleChange} rows={3} />
          </label>

          <div className="grid two-cols">
            <label>
              Movilidad Global
              <select name="movilidadGlobal" value={form.movilidadGlobal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Buena</option>
                <option>Moderada</option>
                <option>Limitada</option>
                <option>Dependiente</option>
              </select>
            </label>
            <label>
              Riesgo de Caídas
              <select name="riesgoCaidas" value={form.riesgoCaidas} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Bajo</option>
                <option>Moderado</option>
                <option>Alto</option>
              </select>
            </label>
          </div>

          <label>
            Objetivos de terapia física
            <textarea name="objetivosTerapia" value={form.objetivosTerapia} onChange={handleChange} rows={4} />
          </label>

          <div className="grid two-cols">
            <label>
              Sesiones por semana
              <input name="sesionesSemana" value={form.sesionesSemana} onChange={handleChange} />
            </label>
            <label>
              Duración de sesión (min)
              <input name="duracionSesion" value={form.duracionSesion} onChange={handleChange} />
            </label>
          </div>

          <fieldset className="checkboxes">
            <legend>Intervenciones propuestas</legend>
            {interventionOptions.map((option) => (
              <label key={option} className="inline">
                <input
                  type="checkbox"
                  checked={form.intervenciones.includes(option)}
                  onChange={() => handleInterventionToggle(option)}
                />
                {option}
              </label>
            ))}
          </fieldset>

          <label>
            Ejercicios indicados hoy
            <textarea name="ejerciciosHoy" value={form.ejerciciosHoy} onChange={handleChange} rows={3} />
          </label>
          <label>
            Recomendaciones
            <textarea name="recomendaciones" value={form.recomendaciones} onChange={handleChange} rows={3} />
          </label>
        </section>

        <section className="panel">
          <h2>Nota de Evolución</h2>
          <label>
            Fecha
            <input type="date" name="fechaEvolucion" value={form.fechaEvolucion} onChange={handleChange} />
          </label>

          <label>
            Piel
            <textarea name="pielEvolucion" value={form.pielEvolucion} onChange={handleChange} rows={2} />
          </label>

          <label>
            Goniometría
            <textarea name="goniometriaEvolucion" value={form.goniometriaEvolucion} onChange={handleChange} rows={2} />
          </label>

          <label>
            Examen Manual Muscular
            <textarea name="examManualMuscularEvolucion" value={form.examManualMuscularEvolucion} onChange={handleChange} rows={2} />
          </label>

          <div className="grid two-cols">
            <label>
              Dolor - Localización
              <input name="dolorLocalizacionEvolucion" value={form.dolorLocalizacionEvolucion} onChange={handleChange} />
            </label>
            <label>
              Dolor - Tipo
              <input name="dolorTipoEvolucion" value={form.dolorTipoEvolucion} onChange={handleChange} />
            </label>
            <label>
              Dolor - Aumento
              <input name="dolorAumentoEvolucion" value={form.dolorAumentoEvolucion} onChange={handleChange} />
            </label>
          </div>

          <label>
            Secuelas que Persisten
            <textarea name="secuelasQuePeristen" value={form.secuelasQuePeristen} onChange={handleChange} rows={3} />
          </label>

          <label>
            Cumplimiento de Objetivos de Terapia Física
            <textarea name="cumplimientoObjetivos" value={form.cumplimientoObjetivos} onChange={handleChange} rows={3} />
          </label>

          <label>
            Recomendaciones
            <textarea name="recomendacionesEvolucion" value={form.recomendacionesEvolucion} onChange={handleChange} rows={3} />
          </label>
        </section>

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={isLoading || isSigningIn}>
            {isLoading ? 'Guardando...' : 'Guardar formulario'}
          </button>
          <button type="button" onClick={generatePdf} disabled={!submitted} className="btn-secondary">
            Generar PDF
          </button>
        </div>

        {userId && (
          <div className="user-info">
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="btn-logout"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        {saveMessage && (
          <p className={`hint ${isSaveError ? '' : 'success'} ${isSaveMessageFading ? 'fade-out' : ''}`}>
            {saveMessage}
          </p>
        )}
      </form>
    </main>
  )
}

export default App
