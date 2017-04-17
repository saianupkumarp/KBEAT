from flask import Blueprint, abort, jsonify, request, current_app, Response, send_file
from core import data, tasks
from datetime import datetime
import os
import StringIO, mimetypes
from werkzeug.datastructures import Headers

from pptx import Presentation
from pptx.chart.data import ChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION
from pptx.dml.color import RGBColor
from pptx.util import Pt, Inches

from reportlab.platypus import BaseDocTemplate, Frame, Paragraph, NextPageTemplate, PageBreak, PageTemplate, Table, TableStyle, Image, Flowable
from reportlab.graphics.shapes import Drawing, _DrawingEditorMixin
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.legends import Legend
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.validators import Auto
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
#Rest API
rest_api = Blueprint('rest_api', __name__)

def _paginate(items, **options):
    offset = options.get('offset', 0)
    count = options.get('count', 0)
    items = items[offset:offset + count if count > 0 else None]

    return dict(objects=items, metadata=dict(count=len(items), offset=offset))

@rest_api.route('/config')
def get_config():
    return jsonify(app_name=current_app.config['APP_NAME'], locales=data.get_locales())

@rest_api.route('/models')
def get_models():
    i18n = request.args.get('locale', 'en')
    return jsonify(_paginate([models.to_primitive() for models in data.get_models()]))

@rest_api.route('/model/<model_name>')
def get_model(model_name):
    model = data.get_model(model_name)
    i18n = request.args.get('locale', 'en')
    return jsonify(model.to_primitive()) if model else abort(404)

@rest_api.route('/models/<model_name>', methods=['POST'])
def run_model(model_name):
    return tasks.run_task(request.data, model_name)

@rest_api.route('/tasks')
def get_tasks(count=10, offset=0):
    return jsonify(data.get_tasks())

@rest_api.route('/tasks/<task_id>')
def get_task(task_id):
    task = data.get_task(task_id)
    return jsonify(task.to_primitive(role='DTO')) if task else abort(404)

@rest_api.route('/tasks/<task_id>/result')
def get_task_result(task_id):
    result = data.get_task_result(task_id)
    return jsonify(result) if result else abort(404)


@rest_api.route('/tasks/<task_id>/pptexport', methods=['GET', 'POST'])
def get_pptx_results(task_id):
    # Flask response
    response = Response()
    response.status_code = 200


    task = data.get_task_result(task_id)

    ## Create presentation with given template
    prs = Presentation("templates/ppt_template.pptx")
    # prs = Presentation()
    # slide_master = prs.slide_master

    ## Define slide template /prs.slide_layouts[number of slide in slide matser template]/
    title_slide_layout = prs.slide_layouts[0]
    table_slide_layout = prs.slide_layouts[4]
    chart_slide_layout = prs.slide_layouts[4]

    ## Slide 1
    firstSlide = prs.slides.add_slide(title_slide_layout)
    ## Create shapes and add title
    firstSlideShapes = firstSlide.shapes
    firstSlideShapes.title.text = "KAPSARC Building Stock Energy Efficiency Analysis"

    ## Slide 2
    PSEtableSlide = prs.slides.add_slide(table_slide_layout)
    PSEtableSlideShapes = PSEtableSlide.shapes
    PSEtableSlideShapes.title.text = 'PSE Table'
    ## Get barChartData
    barChartData = task['barChartData']
    month=['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

    cols = len(month)+1
    rows = len(barChartData)+1
    left = Inches(0.5)
    top = Inches(1.5)
    width = Inches(8)
    height = Inches(0.8)
    ## Add table
    table = PSEtableSlideShapes.add_table(rows, cols, left, top, width, height).table
    # write column headings
    table.cell(0, 0).text = 'Key'
    table.columns[0].width = Inches(1.5)

    ## Add table header and apply text style
    for i,m in enumerate(month):
        table.cell(0, i+1).text = str(month[i])
        table.cell(0,i+1).text_frame.paragraphs[0].font.size=Pt(14)

    ## Create 'barData' list to pass the data values to the bar chart
    barData=[[0 for i in xrange(len(barChartData[0]['values']))] for i in xrange(len(barChartData))]
    ## Add table index and values
    for i,result in enumerate(barChartData):
        table.cell(i+1, 0).text = str(result['key'])
        table.cell(i+1,0).text_frame.paragraphs[0].font.size=Pt(14)
        for j,value in enumerate(result['values']):
            table.cell(i+1, j+1).text = str(result['values'][j]['y'])
            barData[i][j]=str(result['values'][j]['y'])
            table.cell(i+1,j+1).text_frame.paragraphs[0].font.size=Pt(12)



    ## Slide 3
    PSEchartSlide = prs.slides.add_slide(chart_slide_layout)
    PSEchartSlideShapes = PSEchartSlide.shapes
    PSEchartSlideShapes.title.text = 'PSE Chart'
    ## Define chart data
    chart_data = ChartData()
    chart_data.categories = month
    for i,result in enumerate(barChartData):
        chart_data.add_series(str(result['key']), barData[i])

    x, y, cx, cy = Inches(0.5), Inches(1.5), Inches(9), Inches(5)
    PSEchart=PSEchartSlideShapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, x, y, cx, cy, chart_data).chart
    # Add legend
    PSEchart.has_legend = True
    PSEchart.legend.position = XL_LEGEND_POSITION.RIGHT
    PSEchart.legend.include_in_layout = False


    ## Slide 4
    BEPUtableSlide = prs.slides.add_slide(table_slide_layout)
    BEPUtableSlideShapes = BEPUtableSlide.shapes
    BEPUtableSlideShapes.title.text = 'BEPU Table'
    pieChartData = task['pieChartData']

    cols = 2
    rows = len(pieChartData)+1
    left = Inches(0.5)
    top = Inches(1.5)
    width = Inches(5.5)
    height = Inches(1.5)

    table = BEPUtableSlideShapes.add_table(rows, cols, left, top, width, height).table

    # write column headings
    table.cell(0, 0).text = 'Key'
    table.cell(0, 1).text = 'Value'
    ## Create label and values lists to pass the data to the pie chart
    pieDataLabel=[0 for x in range(len(pieChartData))]
    pieDataValue=[0 for x in range(len(pieChartData))]

    ## Add table index and values
    for i,result in enumerate(pieChartData):
        # write body cells
        table.cell(i+1, 0).text = str(result['label'])
        table.cell(i+1, 1).text = str(result['value'])
        pieDataValue[i]=result['value']
        pieDataLabel[i]=str(result['label'])


    ## Slide 5
    chart_slide_layout = prs.slide_layouts[4]
    BEPUchartSlide = prs.slides.add_slide(chart_slide_layout)
    BEPUchartSlideShapes = BEPUchartSlide.shapes
    BEPUchartSlideShapes.title.text = 'BEPU Chart'

    # Define chart data
    chart_data = ChartData()
    chart_data.categories = pieDataLabel
    chart_data.add_series('', pieDataValue)
    # add chart to slide
    x, y, cx, cy = Inches(0.5), Inches(1), Inches(6), Inches(5.5)
    BEPUchart=BEPUchartSlideShapes.add_chart(XL_CHART_TYPE.PIE , x, y, cx, cy, chart_data).chart
    # Add legend
    BEPUchart.has_legend = True
    BEPUchart.legend.position = XL_LEGEND_POSITION.RIGHT
    BEPUchart.legend.include_in_layout = False
    BEPUchart.plots[0].has_data_labels = True
    data_labels = BEPUchart.plots[0].data_labels
    # data_labels=labelc
    # data_labels.number_format_is_linked = False
    # data_labels.number_format = '0%' #%
    data_labels.ShowPercentage=True
    data_labels.ShowValue=False
    data_labels.position = XL_LABEL_POSITION.CENTER



    ## Slide 6
    title_only_slide_layout = prs.slide_layouts[4]
    CalibrationSlide = prs.slides.add_slide(title_only_slide_layout)
    CalibrationSlideShapes = CalibrationSlide.shapes
    CalibrationSlideShapes.title.text = 'Calibration Data'
    #get data values
    calibrationData = task['calibrationData']

    cols = 2
    rows = len(calibrationData)+1
    left = Inches(0.5)
    top = Inches(1.5)
    width = Inches(7.5)
    height = Inches(0.8)

    table = CalibrationSlideShapes.add_table(rows, cols, left, top, width, height).table

    # set column widths
    table.columns[0].width = Inches(2.3)
    calibrationDataLabel=[0 for x in range(len(calibrationData))]
    for i,result in enumerate(calibrationData):
        # write body cells
        table.cell(i, 0).text = str(result)
        table.cell(i, 1).text = str(calibrationData[result])


    #Saving file to a in-memory file
    output_file = StringIO.StringIO()
    prs.save(output_file)
    output_file.seek(0)

    # Set filname and mimetype
    file_name = 'KEEC_export_{}.pptx'.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    #Returning the file from memory
    return send_file(output_file, attachment_filename=file_name, as_attachment=True)




@rest_api.route('/tasks/<task_id>/pdfexport', methods=['GET', 'POST'])
def get_pdf_results(task_id):

        # Flask response
    response = Response()
    response.status_code = 200


    task = data.get_task_result(task_id)
    #Saving file to a in-memory file
    output_file = StringIO.StringIO()

    def header_footer(canvas, doc):

        canvas.saveState()

        background ='static/img/pdf_bg.png'
        canvas.drawImage(background,1*inch,5.75*inch, width=8*inch,height=6*inch,mask='auto')


        # Header
        logo =Image('static/img/logo/logo.png')
        logo.drawHeight = 0.5*inch
        logo.drawWidth = 1.75*inch
        date=datetime.now().strftime("%y-%m-%d %H:%M")
        headerData= [[logo, '', date]]
        headerTable = Table(headerData, colWidths=[2*inch,3.58 * inch,1.2* inch],
             style=[('LINEBELOW',(0,0),(2,0),1,colors.HexColor(0xcccccc)),
                    ('TEXTCOLOR',(0,0),(2,0),colors.HexColor(0x807F83)),
                    ('VALIGN',(1,0),(1,0),'MIDDLE'),
                    ('VALIGN',(2,0),(2,0),'MIDDLE')])
        headerTable.wrapOn(canvas, doc.width, doc.topMargin)
        headerTable.drawOn(canvas, doc.leftMargin, doc.height + doc.topMargin)

        pageNum ="Page %d" % doc.page
        footerData= [['KAPSARC Building Stock Energy Efficiency Analysis', pageNum]]
        footerTable = Table(footerData, colWidths=[5.76*inch,1* inch],
             style=[('LINEABOVE',(0,0),(1,0),2,colors.HexColor(0xcccccc)),
                    ('TEXTCOLOR',(0,0),(1,0),colors.HexColor(0x807F83)),
                    ('ALIGN',(1,0),(1,0),'RIGHT')])
        footerTable.wrapOn(canvas, doc.width, doc.bottomMargin)
        footerTable.drawOn(canvas, doc.leftMargin, 0.5*inch)

        canvas.restoreState()

    pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))
    pdfmetrics.registerFont(TTFont('VeraBd', 'VeraBd.ttf'))
    pdfmetrics.registerFont(TTFont('VeraIt', 'VeraIt.ttf'))
    pdfmetrics.registerFont(TTFont('VeraBI', 'VeraBI.ttf'))
    styles=getSampleStyleSheet()
    # Title
    styles.add(ParagraphStyle(name = 'styleTitle',
                                      alignment= TA_CENTER,
                                      fontSize = 16,
                                      fontName ='Vera',
                                      textColor= colors.HexColor(0x61a659),
                                      leading = 30,
                                      spaceBefore = 35,
                                      spaceAfter = 20))
    # Headings
    styles.add(ParagraphStyle(name = 'styleHeading',
                                      parent = styles['Heading2'],
                                      fontSize = 16,
                                      textColor = colors.HexColor(0x807F83),
                                      leading = 20,
                                      spaceBefore = 20,
                                      underlineProportion=1.1,
                                      spaceAfter = 20))
    styles.add(ParagraphStyle(name = 'styleHeading2',
                                      alignment= TA_CENTER,
                                      fontSize = 12,
                                      fontName ='Vera',
                                      textColor= colors.HexColor(0x61a659),
                                      leading = 20,
                                      spaceBefore = 20,
                                      spaceAfter = 20))
    # Body text
    styles.add(ParagraphStyle(name = 'styleBodyText',
                                      parent = styles['Normal'],
                                      fontSize = 12,
                                      textColor= colors.HexColor(0x666666),
                                      spaceBefore = 6))

    styleTitle = styles['styleTitle']
    styleHeading = styles['styleHeading']
    styleHeading2 = styles['styleHeading2']
    styleBodyText = styles['styleBodyText']
    pdf_chart_colors = [
            "#3D6531",
            "#61a24f",
            "#89B97B",
            "#B0D1A7",
            "#cde5c7",
            "#7e7f82",
            "#9E9FA1",
            "#BFBFC1",
            "#DFDFE0",
            "#ffd200",
            "#FFE360",
            "#FFEE9F",
            ]

    Elements=[]
    doc = BaseDocTemplate(output_file, showBoundary=0, pagesize=A4,
    leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=inch, bottomMargin=inch)

    frame = Frame(doc.leftMargin, doc.topMargin, doc.width, doc.height,topPadding=0.3*inch, showBoundary=0)
    template = PageTemplate(id='template', frames=[frame], onPage=header_footer)
    doc.addPageTemplates([template])



    #add some flowables
    Elements.append(Paragraph("KAPSARC Building Stock Energy Efficiency Analysis",styleTitle))
    Elements.append(Paragraph("Calibration Data",styleHeading))
    calibrationData = task['calibrationData']

    calibrationTableData=[[0 for i in xrange(2)] for i in xrange(len(calibrationData))]
    for i,result in enumerate(calibrationData):
        # write body cells
        calibrationTableData[i][0] = str(result)
        calibrationTableData[i][1] = str(calibrationData[result])

    t=Table(calibrationTableData,style=[
      ('TEXTCOLOR',(0,0),(-1,-1),colors.HexColor(0x666666)),
      ('FONTSIZE',(0,0),(-1,-1),12),
      ('FONTNAME',(0,0),(-1,-1),'Helvetica'),
      ('FONTNAME',(0,0),(0,len(calibrationTableData)-1),'Helvetica-Bold'),
      ('BOX',(0,0),(-1,-1),1.5,colors.HexColor(0x807F83)),
     ])

    Elements.append(t)




    Elements.append(PageBreak())
    Elements.append(Paragraph("PSE Report:",styleHeading))
    Elements.append(Paragraph("Table",styleHeading2))
    barChartData = task['barChartData']
    month=['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']


    PSEtableData=[[0 for i in xrange(len(barChartData[0]['values'])+1)] for i in xrange(len(barChartData)+1)]
    PSEchartData=[[0 for i in xrange(len(barChartData[0]['values']))] for i in xrange(len(barChartData))]
    PSEchartLegend=[0 for i in xrange(len(barChartData))]
    PSEtableData[0][0] = 'Key'
    for i,m in enumerate(month):
        PSEtableData[0][i+1] = str(month[i])
    for i,result in enumerate(barChartData):
        # write body cells
        PSEtableData[i+1][0] = str(result['key'])
        PSEchartLegend[i] = str(result['key'])
        for j,value in enumerate(result['values']):
            PSEtableData[i+1][j+1]=str(result['values'][j]['y'])
            PSEchartData[i][j]=result['values'][j]['y']

    t=Table(PSEtableData,style=[
     ('TEXTCOLOR',(0,0),(-1,-1),colors.HexColor(0x666666)),
     ('FONTSIZE',(0,0),(-1,-1),9),
     ('FONTNAME',(0,0),(-1,-1),'Helvetica'),
     ('FONTNAME',(0,0),(len(PSEtableData[0])-1,0),'Helvetica-Bold'),
     ('LINEBELOW',(0,0),(len(PSEtableData[0]),0),1,colors.HexColor(0x807F83)),
     ('BOX',(0,0),(-1,-1),1.5,colors.HexColor(0x807F83)),
     ('ALIGN',(0,0),(0,0),'CENTER'),
     ])
    # t._argW[3]=6*inch
    Elements.append(t)
    #start the construction of the pdf
    Elements.append(Paragraph('<br /><br />', styleBodyText))

    Elements.append(Paragraph("Chart",styleHeading2))
    drawing = Drawing(400, 200)

    bc = VerticalBarChart()
    bc.x=30
    bc.y=0
    bc.height = 200
    bc.width = 350

    bc.data = PSEchartData
    bc.strokeColor = colors.black
    # bc.fillColor=colors.blue
    bc.valueAxis.valueMin = 0

    sumPSEcolumnData= [0 for i in xrange(len(PSEchartData))]
    for j, result in enumerate(PSEchartData[0]):
        sumColum=0
        for i, result in enumerate(PSEchartData):
            sumColum+=PSEchartData[i][j]
        sumPSEcolumnData[j]=sumColum
    bc.valueAxis.valueMax = max(sumPSEcolumnData)
    # bc.valueAxis.valueStep = 100
    bc.strokeWidth = 0
    bc.valueAxis.valueMin = 0
    bc.categoryAxis.style = 'stacked'
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.categoryAxis.labels.dx = 10
    bc.categoryAxis.labels.dy = -2
    # bc.categoryAxis.labels.angle = 20
    bc.valueAxis.labels.fontName  = 'Helvetica'
    bc.valueAxis.labels.fontSize  = 10
    bc.valueAxis.strokeWidth  = 0.5
    bc.valueAxis.strokeColor  = colors.HexColor(0x807F83)
    bc.categoryAxis.strokeWidth  = 0.5
    bc.categoryAxis.strokeColor  = colors.HexColor(0x807F83)
    bc.valueAxis.labels.fillColor  = colors.HexColor(0x807F83)
    bc.categoryAxis.labels.fontName  = 'Helvetica'
    bc.categoryAxis.labels.fontSize  = 10
    bc.categoryAxis.labels.fillColor  = colors.HexColor(0x807F83)
    bc.categoryAxis.categoryNames = month
    # create a list and add the elements of our document (image, paragraphs, table, chart) to it
    #add our barchart and legend
    bc.barWidth = .3*inch
    bc.groupSpacing = .2 * inch

    bc.bars.strokeColor     = colors.HexColor(0xffffff)
    bc.bars.strokeWidth     = 0.5
    for i , r in enumerate(PSEchartLegend):
        bc.bars[i].fillColor= colors.HexColor(pdf_chart_colors[i])
    #  = colors.blue
    # bc.bars[1].fillColor = colors.lightblue


    swatches = Legend()
    swatches.alignment = 'right'
    swatches.x = bc.width+bc.x+20
    swatches.y = bc.height+bc.y
    swatches.deltax = 40
    swatches.dxTextSpace = 5

    swatches.dx              = 8
    swatches.dy              = 8
    swatches.fontName        = 'Helvetica'
    swatches.fillColor = colors.HexColor(0x807F83)
    swatches.fontSize        = 10
    swatches.boxAnchor       = 'nw'
    swatches.columnMaximum   = (len(bc.data)+1)/2
    swatches.strokeWidth     = 0.5
    swatches.strokeColor     = colors.HexColor(0xffffff)
    swatches.deltax          = 75
    swatches.deltay          = 12
    # # # swatches.autoXPadding    = 7
    # # # swatches.yGap            = 0
    # # # swatches.dxTextSpace     = 5
    # # # swatches.dividerLines    = 1|2|4
    # # # swatches.dividerOffsY    = 5
    # # # swatches.subCols.rpad    = 40
    swatches.dividerColor    = colors.HexColor(0xdedede)

    swatches.columnMaximum = len(PSEchartLegend)
    swatches.colorNamePairs = [(bc.bars[i].fillColor, PSEchartLegend[i]) for i in xrange(len(bc.data))]

    # drawing.hAlign = 'RIGHT'


    drawing.add(swatches, 'legend')

    drawing.add(bc)

    Elements.append(drawing)

    Elements.append(PageBreak())


    Elements.append(Paragraph("BEPU Report:",styleHeading))
    Elements.append(Paragraph("Table",styleHeading2))
    pieChartData = task['pieChartData']
    BEPUtableData=[[0 for i in xrange(len(pieChartData[0]))] for i in xrange(len(pieChartData)+1)]
    BEPUchartLabel=[0 for i in xrange(len(pieChartData))]
    BEPUchartData=[0 for i in xrange(len(pieChartData))]
    BEPUtableData[0][0]= 'Key'
    BEPUtableData[0][1] = 'Value'
    for i,result in enumerate(pieChartData):
        # write body cells
        BEPUtableData[i+1][0]= str(result['label'])
        BEPUtableData[i+1][1] = str(result['value'])
        BEPUchartLabel[i] = str(result['label'])
        BEPUchartData[i] = result['value']

    t=Table(BEPUtableData,style=[
     ('TEXTCOLOR',(0,0),(-1,-1),colors.HexColor(0x666666)),
     ('FONTSIZE',(0,0),(-1,-1),9),
     ('FONTNAME',(0,0),(-1,-1),'Helvetica'),
     ('FONTNAME',(0,0),(len(BEPUtableData[0])-1,0),'Helvetica-Bold'),
     ('LINEBELOW',(0,0),(len(BEPUtableData[0]),0),1,colors.HexColor(0x807F83)),
     ('BOX',(0,0),(-1,-1),1.5,colors.HexColor(0x807F83)),
     ])

    Elements.append(t)

    Elements.append(Paragraph('<br /><br />', styleBodyText))
    Elements.append(Paragraph("Chart",styleHeading2))
    d = Drawing(400,200)
    pc = Pie()
    pc.data = BEPUchartData
    labelc=[0 for i in xrange(len(BEPUchartData))]
    for i , r in enumerate(BEPUchartData):
        labelc[i]=str(round(r/sum(BEPUchartData)*100,1))+"%"
    pc.labels = labelc
    pc.slices.strokeWidth=0.5
    # pc.slices[3].popout = 20
    # pc.slices[3].strokeWidth = 2
    # pc.slices[3].strokeDashArray = [2,2]
    # pc.slices[3].labelRadius = 1.75
    # pc.slices[3].fontColor = colors.red
    # pc.legend.x=200
    pc._seriesCount = len(BEPUchartLabel)
    pc.slices.strokeColor     = colors.HexColor(0xffffff)
    pc.slices.strokeWidth     = 0.5
    for i , r in enumerate(BEPUchartLabel):
        pc.slices[i].fillColor= colors.HexColor(pdf_chart_colors[i])

    pc.width=  pc.height= 150

    pc.x=50
    pc.y=20
    # add_legend(d, pc)
    legend = Legend()
    legend.alignment = 'right'
    legend.x = pc.width+pc.x+50
    legend.y = pc.height
    legend.dx              = 8
    legend.dy              = 8
    legend.fontName        = 'Helvetica'
    legend.fillColor = colors.HexColor(0x807F83)
    legend.fontSize        = 10
    legend.boxAnchor       = 'nw'
    # legend.columnMaximum   = (len(pc.data)+1)/2
    legend.columnMaximum   = 8
    legend.strokeWidth     = 0.5
    legend.strokeColor     = colors.HexColor(0xffffff)
    legend.deltax          = 75
    legend.deltay          = 10
    legend.autoXPadding    = 10
    legend.yGap            = 0
    legend.dxTextSpace     = 5
    legend.dividerLines    = 1|2|4
    legend.dividerOffsY    = 6
    legend.subCols.rpad    = 20
    legend.dividerColor    = colors.HexColor(0xdedede)
    legend.colorNamePairs = [(pc.slices[i].fillColor, (BEPUchartLabel[i][0:20], '  %0.2f' % pc.data[i])) for i in xrange(len(pc.data))]
    d.add(legend)
    # pc.x = 150
    # pc.y= 20
    pc.slices.fontColor = colors.HexColor(0x807F83)
    n = len(pc.data)

    d.add(pc, '')


    Elements.append(d)

    doc.build(Elements)

    output_file.seek(0)

    # Set filname and mimetype
    file_name = 'KEEC_export_{}.pdf'.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    #Returning the file from memory
    return send_file(output_file, attachment_filename=file_name, as_attachment=True)
