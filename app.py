import os
import pandas as pd
from flask import (
    Flask,
    render_template,
    request,
    session,
    send_file,
    abort,
    jsonify
)
from io import BytesIO

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Columnas base que obtuvimos en /control
COLUMNS = [
    'Nombre', 'Equipo', 'Segmento',
    'Ingreso Sábado', 'Egreso Sábado',
    'Ingreso Domingo', 'Egreso Domingo'
]
TIME_COLS = ['Ingreso Sábado', 'Egreso Sábado', 'Ingreso Domingo', 'Egreso Domingo']


@app.route('/', methods=['GET', 'POST'])
@app.route('/control', methods=['GET', 'POST'])
def control_fin_semana():
    """
    Mismo controlador de /control que ya tenías: lee el Excel subido,
    guarda en sesión la lista de diccionarios final (solo con las 7 columnas
    de COLUMNS), y genera la vista con las pestañas por equipo.
    """
    if request.method == 'POST':
        uploaded = request.files.get('file')
        if not uploaded:
            return render_template(
                'control.html',
                error='Por favor sube un archivo.',
                groups=None,
                columns=COLUMNS
            )

        try:
            # Leemos todas las hojas del Excel y concatenamos
            sheets = pd.read_excel(uploaded, sheet_name=None, header=1)
            df = pd.concat(sheets.values(), ignore_index=True)
        except Exception as e:
            return render_template(
                'control.html',
                error=f'Error leyendo Excel: {e}',
                groups=None,
                columns=COLUMNS
            )

        # Verificar que existan todas las columnas necesarias
        for col in COLUMNS:
            if col not in df.columns:
                return render_template(
                    'control.html',
                    error=f'Falta columna "{col}".',
                    groups=None,
                    columns=COLUMNS
                )

        # Nos quedamos solo con las columnas de interés
        control_df = df[COLUMNS].copy()

        # Convertir a cadena "HH:MM" (o "00:00" si no hay hora)
        for tcol in TIME_COLS:
            control_df[tcol] = control_df[tcol].apply(
                lambda x: x.strftime('%H:%M') if pd.notnull(x) else '00:00'
            )

        # Guardamos en sesión como lista de registros (dict)
        session['final_data'] = control_df.to_dict(orient='records')

        # Agrupamos por Equipo para pasarlo a la vista de control
        groups = {
            team: sub.to_dict(orient='records')
            for team, sub in control_df.groupby('Equipo')
        }

        return render_template(
            'control.html',
            groups=groups,
            columns=COLUMNS
        )

    # Si es GET, simplemente renderizamos la pantalla de control (sin grupos)
    return render_template(
        'control.html',
        groups=None,
        columns=COLUMNS
    )


@app.route('/guardia')
def guardia():
    """
    Renderiza la página guardia.html (que contiene todo el front-end
    de filtros, tabla dinámica y botón de exportar). No va data directa,
    pues el JS tomará de localStorage los datos que puso control.html.
    """
    return render_template('guardia.html')


@app.route('/export_guardia', methods=['POST'])
def export_guardia():
    """
    Esta ruta recibe un JSON (desde guardia.html) con el arreglo completo de registros,
    incluyendo los campos:
      - Nombre, Equipo, Segmento,
      - Ingreso Sábado, Egreso Sábado, Estado Sábado, Observacion Sábado,
      - Ingreso Domingo, Egreso Domingo, Estado Domingo, Observacion Domingo.

    Construye un DataFrame con esas 11 columnas y devuelve un .xlsx para descargar.
    """
    try:
        data = request.get_json(force=True)
    except:
        return abort(400, description="El JSON enviado no es válido.")

    if not isinstance(data, list) or not data:
        return abort(400, description="No se envió un arreglo válido en el cuerpo JSON.")

    # Convertimos a DataFrame
    df = pd.DataFrame(data)

    # Verificamos que existan las columnas necesarias:
    expected_cols = [
        'Nombre', 'Equipo', 'Segmento',
        'Ingreso Sábado', 'Egreso Sábado', 'EstadoSábado', 'ObservacionSábado',
        'Ingreso Domingo', 'Egreso Domingo', 'EstadoDomingo', 'ObservacionDomingo'
    ]
    for col in expected_cols:
        if col not in df.columns:
            return abort(400, description=f"Falta columna '{col}' en el JSON enviado.")

    # Reordenamos las columnas en el orden deseado:
    df = df[expected_cols].copy()

    # Armamos el Excel en memoria
    bio = BytesIO()
    with pd.ExcelWriter(bio, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Guardia_Sábado_Domingo', index=False)
    bio.seek(0)

    return send_file(
        bio,
        as_attachment=True,
        download_name='Guardia_Sábado_Domingo.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


if __name__ == '__main__':
    # Cambia host/port si lo necesitas, pero en debug=True para pruebas.
    app.run(debug=True)
