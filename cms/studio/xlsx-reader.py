"""Read cell values only. No macros, formula evaluation, links or file extraction."""
import io
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

MAX_FILE = 2 * 1024 * 1024
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

def read_workbook(data):
    if len(data) > MAX_FILE:
        raise ValueError("El Excel supera 2 MB.")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) > 100 or len({entry.filename for entry in entries}) != len(entries):
            raise ValueError("Estructura XLSX no permitida.")
        if any("externalLinks/" in e.filename or "vbaProject" in e.filename for e in entries):
            raise ValueError("No se admiten macros ni vínculos externos.")
        if sum(e.file_size for e in entries) > 12 * 1024 * 1024:
            raise ValueError("El contenido descomprimido supera el límite.")
        def xml(name):
            info = archive.getinfo(name)
            if info.file_size > 8 * 1024 * 1024:
                raise ValueError("La hoja Excel supera el límite.")
            with archive.open(info) as source:
                raw = source.read(8 * 1024 * 1024 + 1)
            if len(raw) > 8 * 1024 * 1024 or re.search(br"<!\s*(DOCTYPE|ENTITY)\b", raw, re.I):
                raise ValueError("XML interno no permitido.")
            return ET.fromstring(raw)
        sheets = xml("xl/workbook.xml").findall("m:sheets/m:sheet", NS)
        if len(sheets) != 1:
            raise ValueError("Se requiere un informe GlobalBake de una sola hoja.")
        targets = [e.filename for e in entries if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", e.filename)]
        if len(targets) != 1:
            raise ValueError("No se encontró una hoja única.")
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            for node in xml("xl/sharedStrings.xml").findall("m:si", NS):
                strings.append("".join(t.text or "" for t in node.findall(".//m:t", NS)))
        rows = []
        previous = 0
        for node in xml(targets[0]).findall("m:sheetData/m:row", NS):
            number = int(node.get("r", 0))
            if number <= previous or number > 20000:
                raise ValueError("Numeración de filas inválida o informe demasiado largo.")
            previous = number
            cells = {}
            for cell in node.findall("m:c", NS):
                if cell.find("m:f", NS) is not None:
                    raise ValueError("No se admiten fórmulas; exporta valores desde GlobalBake.")
                reference = cell.get("r", "")
                if not re.fullmatch(r"[A-Z]{1,2}\d+", reference):
                    raise ValueError("Referencia de celda inválida.")
                column = re.sub(r"\d", "", reference)
                value = cell.find("m:v", NS)
                value = value.text if value is not None else "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                if cell.get("t") == "s":
                    index = int(value)
                    if index < 0 or index >= len(strings):
                        raise ValueError("Cadena Excel inválida.")
                    value = strings[index]
                if value:
                    if len(value) > 8000:
                        raise ValueError("Texto de celda demasiado largo.")
                    cells[column] = value
            if cells:
                rows.append({"row": number, "cells": cells})
        return {"sheet": sheets[0].get("name"), "rows": rows}

if __name__ == "__main__":
    try:
        print(json.dumps(read_workbook(sys.stdin.buffer.read(MAX_FILE + 1)), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error) if isinstance(error, ValueError) else "El archivo no es un XLSX válido."}))
        sys.exit(1)
