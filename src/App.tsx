import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'

type FormState = {
  nombrePaciente: string
  fechaNacimiento: string
  edad: string
  sexo: string
  diagnostico: string
  telefonoPaciente: string
  direccion: string
  fechaEvaluacion: string
  caidas12Meses: string
  lesionesRelacionadas: string
  enfermedadesCronicas: string
  medicacionRelevante: string
  ayudaMarcha: string
  limitacionesCognitivas: string
  fc: string
  pa: string
  satO2: string
  fr: string
  dolor: string
  tugTiempo: string
  tugObservaciones: string
  marchaTiempo: string
  marchaVelocidad: string
  marchaObservaciones: string
  chairStandTipo: string
  chairStandResultado: string
  chairStandObservaciones: string
  tuvoCaidas: string
  caidasDetalle: string
  miedoCaer: string
  functionalReach: string
  functionalReachObs: string
  fesPuntaje: string
  movilidadGlobal: string
  riesgoCaidas: string
  comentariosClave: string
  objetivosTerapia: string
  sesionesSemana: string
  duracionSesion: string
  intervenciones: string[]
  ejerciciosHoy: string
  recomendaciones: string
  evolucion: string
  notasAdicionales: string
}

type SavedForm = {
  id: string
  data: Partial<FormState>
  updatedAt: string
}

const initialForm: FormState = {
  nombrePaciente: '',
  fechaNacimiento: '',
  edad: '',
  sexo: '',
  diagnostico: '',
  telefonoPaciente: '',
  direccion: '',
  fechaEvaluacion: '',
  caidas12Meses: '',
  lesionesRelacionadas: '',
  enfermedadesCronicas: '',
  medicacionRelevante: '',
  ayudaMarcha: '',
  limitacionesCognitivas: '',
  fc: '',
  pa: '',
  satO2: '',
  fr: '',
  dolor: '',
  tugTiempo: '',
  tugObservaciones: '',
  marchaTiempo: '',
  marchaVelocidad: '',
  marchaObservaciones: '',
  chairStandTipo: '',
  chairStandResultado: '',
  chairStandObservaciones: '',
  tuvoCaidas: '',
  caidasDetalle: '',
  miedoCaer: '',
  functionalReach: '',
  functionalReachObs: '',
  fesPuntaje: '',
  movilidadGlobal: '',
  riesgoCaidas: '',
  comentariosClave: '',
  objetivosTerapia: '',
  sesionesSemana: '',
  duracionSesion: '',
  intervenciones: [],
  ejerciciosHoy: '',
  recomendaciones: '',
  evolucion: '',
  notasAdicionales: '',
}

type LegacyFormData = Partial<FormState> & {
  dniHistoria?: string
  ta?: string
  objetivo1?: string
  objetivo2?: string
  objetivo3?: string
  impresionFuncional?: string
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

const FORMS_STORAGE_KEY = 'formularios-evaluacion-funcional'

const cloneForm = (form: FormState): FormState => ({
  ...form,
  intervenciones: [...form.intervenciones],
})

const hydrateForm = (raw?: LegacyFormData): FormState => {
  const safe = raw ?? {}
  const legacyObjetivos = [safe.objetivo1, safe.objetivo2, safe.objetivo3]
    .map((item) => (item ?? '').trim())
    .filter(Boolean)
    .join('\n')

  return {
    ...initialForm,
    ...safe,
    diagnostico: (safe.diagnostico ?? safe.dniHistoria ?? '').trim(),
    pa: (safe.pa ?? safe.ta ?? '').trim(),
    objetivosTerapia: (safe.objetivosTerapia ?? legacyObjetivos).trim(),
    evolucion: (safe.evolucion ?? safe.impresionFuncional ?? '').trim(),
    intervenciones: Array.isArray(safe.intervenciones) ? safe.intervenciones : [],
  }
}

const buildFormId = (nombrePaciente: string, telefonoPaciente: string) =>
  `${nombrePaciente.trim()} + ${telefonoPaciente.trim()}`

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

const calculateAge = (birthDateValue: string) => {
  if (!birthDateValue) {
    return ''
  }

  const birthDate = new Date(`${birthDateValue}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) {
    return ''
  }

  const todayDate = new Date()
  let years = todayDate.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet =
    todayDate.getMonth() < birthDate.getMonth() ||
    (todayDate.getMonth() === birthDate.getMonth() && todayDate.getDate() < birthDate.getDate())

  if (hasNotHadBirthdayYet) {
    years -= 1
  }

  return years >= 0 ? String(years) : ''
}

function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [savedForms, setSavedForms] = useState<SavedForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [loadedFormId, setLoadedFormId] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaveMessageFading, setIsSaveMessageFading] = useState(false)

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORMS_STORAGE_KEY)
      if (!raw) {
        setSavedForms([])
        return
      }

      const parsed = JSON.parse(raw) as SavedForm[]
      const normalized = parsed
        .filter((item) => item?.id && item?.data)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setSavedForms(normalized)
    } catch {
      setSavedForms([])
      setSaveMessage('No fue posible leer formularios guardados en este navegador.')
    }
  }, [])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => {
      if (name === 'fechaNacimiento') {
        return {
          ...prev,
          fechaNacimiento: value,
          edad: calculateAge(value),
        }
      }

      return { ...prev, [name]: value }
    })
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

    const nombrePaciente = form.nombrePaciente.trim()
    const telefonoPaciente = form.telefonoPaciente.trim()

    if (!nombrePaciente || !telefonoPaciente) {
      setSaveMessage('Para guardar, completa nombre y teléfono del paciente.')
      return
    }

    const formId = buildFormId(nombrePaciente, telefonoPaciente)
    try {
      const now = new Date().toISOString()
      const entry: SavedForm = {
        id: formId,
        data: cloneForm({ ...form, nombrePaciente, telefonoPaciente }),
        updatedAt: now,
      }

      const next = [entry, ...savedForms.filter((item) => item.id !== formId)]
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(next))
      setSavedForms(next)
      setSelectedFormId(formId)
      setLoadedFormId(formId)
      setSaveMessage('Formulario guardado. Ya puedes generar el PDF.')
      setSubmitted(true)
    } catch {
      setSaveMessage('Error al guardar formulario en este navegador.')
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

  const handleDeleteLoadedForm = () => {
    if (!loadedFormId) {
      return
    }

    const confirmed = window.confirm(
      `¿Deseas eliminar el formulario cargado?\n\n${loadedFormId}\n\nEsta acción no se puede deshacer.`,
    )

    if (!confirmed) {
      return
    }

    try {
      const next = savedForms.filter((item) => item.id !== loadedFormId)
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(next))
      setSavedForms(next)
      setForm(cloneForm(initialForm))
      setSelectedFormId('')
      setLoadedFormId('')
      setSubmitted(false)
      setSaveMessage('Formulario eliminado correctamente.')
    } catch {
      setSaveMessage('Error al eliminar formulario del navegador.')
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
          { label: 'Fecha de nacimiento', value: formatDateForPdf(form.fechaNacimiento) },
          { label: 'Edad', value: form.edad },
          { label: 'Sexo', value: form.sexo },
          { label: 'Diagnóstico', value: form.diagnostico },
          { label: 'Teléfono', value: form.telefonoPaciente },
          { label: 'Dirección', value: form.direccion },
          { label: 'Fecha de evaluación', value: formatDateForPdf(form.fechaEvaluacion) },
        ],
      },
      {
        title: '2. Antecedentes relevantes',
        rows: [
          { label: 'Caídas últimos 12 meses', value: form.caidas12Meses },
          { label: 'Lesiones relacionadas', value: form.lesionesRelacionadas },
          { label: 'Enfermedades crónicas', value: form.enfermedadesCronicas },
          { label: 'Medicación relevante', value: form.medicacionRelevante },
          { label: 'Ayudas para la marcha', value: form.ayudaMarcha },
          { label: 'Limitaciones cognitivas/sensoriales', value: form.limitacionesCognitivas },
        ],
      },
      {
        title: '3. Signos vitales y cribado',
        rows: [
          { label: 'FC (lpm)', value: form.fc },
          { label: 'PA (mmHg)', value: form.pa },
          { label: 'SatO2 (%)', value: form.satO2 },
          { label: 'FR (rpm)', value: form.fr },
          { label: 'Dolor (0-10)', value: form.dolor },
          { label: 'TUG tiempo (s)', value: form.tugTiempo },
          { label: 'TUG observaciones', value: form.tugObservaciones },
          { label: 'Marcha 4m tiempo (s)', value: form.marchaTiempo },
          { label: 'Marcha velocidad (m/s)', value: form.marchaVelocidad },
          { label: 'Marcha observaciones', value: form.marchaObservaciones },
          { label: 'Chair Stand tipo', value: form.chairStandTipo },
          { label: 'Chair Stand resultado', value: form.chairStandResultado },
          { label: 'Chair Stand observaciones', value: form.chairStandObservaciones },
          { label: '¿Tuvo caídas?', value: form.tuvoCaidas },
          { label: 'Detalle de caídas', value: form.caidasDetalle },
          { label: 'Miedo a caer', value: form.miedoCaer },
          { label: 'Functional Reach (cm)', value: form.functionalReach },
          { label: 'Functional Reach observaciones', value: form.functionalReachObs },
          { label: 'FES-I breve puntaje', value: form.fesPuntaje },
        ],
      },
      {
        title: '4. Resumen y plan',
        rows: [
          { label: 'Movilidad global', value: form.movilidadGlobal },
          { label: 'Riesgo de caídas', value: form.riesgoCaidas },
          { label: 'Comentarios clave', value: form.comentariosClave },
          { label: 'Objetivos de terapia física', value: form.objetivosTerapia },
          { label: 'Sesiones por semana', value: form.sesionesSemana },
          { label: 'Duración por sesión (min)', value: form.duracionSesion },
          {
            label: 'Intervenciones propuestas',
            value: form.intervenciones.join(', '),
          },
          { label: 'Ejercicios indicados hoy', value: form.ejerciciosHoy },
          { label: 'Recomendaciones', value: form.recomendaciones },
          { label: 'Evolución', value: form.evolucion },
          { label: 'Notas adicionales', value: form.notasAdicionales },
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
                  {item.id}
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
          <button type="button" onClick={handleDeleteLoadedForm} disabled={!loadedFormId} className="btn-danger">
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
              Fecha de nacimiento
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
            </label>
            <label>
              Edad
              <input name="edad" value={form.edad} readOnly />
            </label>
            <label>
              Sexo
              <input name="sexo" value={form.sexo} onChange={handleChange} />
            </label>
            <label>
              Diagnóstico
              <input name="diagnostico" value={form.diagnostico} onChange={handleChange} />
            </label>
            <label>
              Teléfono
              <input name="telefonoPaciente" value={form.telefonoPaciente} onChange={handleChange} />
            </label>
            <label>
              Fecha evaluación
              <input type="date" name="fechaEvaluacion" value={form.fechaEvaluacion} onChange={handleChange} />
            </label>
          </div>
          <label>
            Dirección
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </label>
        </section>

        <section className="panel">
          <h2>Antecedentes y cribado</h2>
          <div className="grid two-cols">
            <label>
              Caídas en 12 meses (nº)
              <input name="caidas12Meses" value={form.caidas12Meses} onChange={handleChange} />
            </label>
            <label>
              Lesiones relacionadas
              <input name="lesionesRelacionadas" value={form.lesionesRelacionadas} onChange={handleChange} />
            </label>
            <label>
              Enfermedades crónicas
              <input name="enfermedadesCronicas" value={form.enfermedadesCronicas} onChange={handleChange} />
            </label>
            <label>
              Medicación relevante
              <input name="medicacionRelevante" value={form.medicacionRelevante} onChange={handleChange} />
            </label>
            <label>
              Ayuda para la marcha
              <select name="ayudaMarcha" value={form.ayudaMarcha} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Ninguna</option>
                <option>Bastón</option>
                <option>Andador</option>
                <option>Otra</option>
              </select>
            </label>
            <label>
              Limitaciones cognitivas/sensoriales
              <input name="limitacionesCognitivas" value={form.limitacionesCognitivas} onChange={handleChange} />
            </label>
          </div>
          <div className="grid five-cols">
            <label>
              FC
              <input name="fc" value={form.fc} onChange={handleChange} />
            </label>
            <label>
              PA
              <input name="pa" value={form.pa} onChange={handleChange} />
            </label>
            <label>
              SatO2
              <input name="satO2" value={form.satO2} onChange={handleChange} />
            </label>
            <label>
              FR
              <input name="fr" value={form.fr} onChange={handleChange} />
            </label>
            <label>
              Dolor (0-10)
              <input name="dolor" value={form.dolor} onChange={handleChange} />
            </label>
          </div>

          <div className="grid two-cols">
            <label>
              TUG tiempo (s)
              <input name="tugTiempo" value={form.tugTiempo} onChange={handleChange} />
            </label>
            <label>
              TUG observaciones
              <input name="tugObservaciones" value={form.tugObservaciones} onChange={handleChange} />
            </label>
            <label>
              Marcha 4m tiempo (s)
              <input name="marchaTiempo" value={form.marchaTiempo} onChange={handleChange} />
            </label>
            <label>
              Marcha velocidad (m/s)
              <input name="marchaVelocidad" value={form.marchaVelocidad} onChange={handleChange} />
            </label>
            <label>
              Marcha observaciones
              <input name="marchaObservaciones" value={form.marchaObservaciones} onChange={handleChange} />
            </label>
            <label>
              Chair Stand (30s o 5-STS)
              <input name="chairStandTipo" value={form.chairStandTipo} onChange={handleChange} />
            </label>
            <label>
              Chair Stand resultado
              <input name="chairStandResultado" value={form.chairStandResultado} onChange={handleChange} />
            </label>
            <label>
              Chair Stand observaciones
              <input name="chairStandObservaciones" value={form.chairStandObservaciones} onChange={handleChange} />
            </label>
            <label>
              ¿Tuvo caídas?
              <select name="tuvoCaidas" value={form.tuvoCaidas} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Sí</option>
                <option>No</option>
              </select>
            </label>
            <label>
              Miedo a caer
              <select name="miedoCaer" value={form.miedoCaer} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Bajo</option>
                <option>Moderado</option>
                <option>Alto</option>
              </select>
            </label>
          </div>

          <label>
            Detalle de caídas / causa / lesiones
            <textarea name="caidasDetalle" value={form.caidasDetalle} onChange={handleChange} rows={3} />
          </label>
          <div className="grid two-cols">
            <label>
              Functional Reach (cm)
              <input name="functionalReach" value={form.functionalReach} onChange={handleChange} />
            </label>
            <label>
              FES-I breve puntuación total
              <input name="fesPuntaje" value={form.fesPuntaje} onChange={handleChange} />
            </label>
          </div>
          <label>
            Observaciones de equilibrio
            <textarea name="functionalReachObs" value={form.functionalReachObs} onChange={handleChange} rows={3} />
          </label>
        </section>

        <section className="panel">
          <h2>Evaluación global y plan</h2>
          <div className="grid two-cols">
            <label>
              Movilidad global
              <select name="movilidadGlobal" value={form.movilidadGlobal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Buena</option>
                <option>Moderada</option>
                <option>Limitada</option>
                <option>Dependiente</option>
              </select>
            </label>
            <label>
              Riesgo de caídas
              <select name="riesgoCaidas" value={form.riesgoCaidas} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Bajo</option>
                <option>Moderado</option>
                <option>Alto</option>
              </select>
            </label>
          </div>
          <label>
            Comentarios clave
            <textarea name="comentariosClave" value={form.comentariosClave} onChange={handleChange} rows={3} />
          </label>

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
          <label>
            Evolución
            <textarea name="evolucion" value={form.evolucion} onChange={handleChange} rows={3} />
          </label>
          <label>
            Notas adicionales
            <textarea name="notasAdicionales" value={form.notasAdicionales} onChange={handleChange} rows={3} />
          </label>
        </section>

        <div className="actions">
          <button type="submit" className="btn-primary">
            Guardar formulario
          </button>
          <button type="button" onClick={generatePdf} disabled={!submitted} className="btn-secondary">
            Generar PDF
          </button>
        </div>

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
