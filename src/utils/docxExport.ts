import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun } from 'docx'
import { saveAs } from 'file-saver'

export async function exportPdaToDocx(pda: any, selectedGroupsData: any[]) {
  const tableRows = []
  
  // Header Row
  tableRows.push(new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sesión", bold:true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Actividad", bold:true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Observaciones", bold:true })] })] }),
      ...selectedGroupsData.map(g => 
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${g.grade}° ${g.name}`, bold:true })] })] })
      )
    ]
  }))

  // Data Rows
  pda.sessions.forEach((session: any) => {
    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(String(session.session_number))] }),
        new TableCell({ children: [new Paragraph(session.activity || "")] }),
        new TableCell({ children: [new Paragraph(session.observations || "")] }),
        ...selectedGroupsData.map((g: any) => {
          const tracking = pda.tracking[session.session_number]?.[g.id]
          const text = tracking ? `Inicio: ${tracking.start_date || '--/--/--'}\nFin: ${tracking.end_date || '--/--/--'}` : '--'
          return new TableCell({ children: [new Paragraph(text)] })
        })
      ]
    }))
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Seguimiento PDA", bold: true, size: 32 })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({ text: `Tema / PDA: ${pda.topic || ''}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Materia: ${pda.subject_name || ''}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Sesiones: ${pda.num_sessions || 0}`, spacing: { after: 200 } }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          })
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `PDA_${pda.topic ? pda.topic.replace(/[^a-zA-Z0-9]/g, '_') : 'Tracking'}.docx`)
}

export async function exportTeamsToDocx(teamsData: any[], activityName: string) {
  const tableRows = []
  
  // Header Row
  tableRows.push(new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Alumno", bold:true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Equipo", bold:true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Calificación", bold:true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Comentarios", bold:true })] })] })
    ]
  }))

  // Filtrar alumnos que tengan equipo (o todos, depende del requerimiento, pero "exportar equipos" suele significar exportar la tabla)
  teamsData.forEach((student: any) => {
    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(`${student.paternal_surname} ${student.maternal_surname} ${student.first_name}`)] }),
        new TableCell({ children: [new Paragraph(student.team_number ? String(student.team_number) : "Sin equipo")] }),
        new TableCell({ children: [new Paragraph(student.activity_score || "")] }),
        new TableCell({ children: [new Paragraph(student.comments || "")] })
      ]
    }))
  })

  // Agrupar por equipo
  const sortedData = [...teamsData].sort((a,b) => (a.team_number || 999) - (b.team_number || 999))

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Equipos de Trabajo", bold: true, size: 32 })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({ text: `Actividad: ${activityName}`, spacing: { after: 200 } }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          })
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `Equipos_${activityName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`)
}

