export function createErpModel({ field, choices, count, unique }) {
  const decimal = name => field(name, 'decimal', { schema: { numeric_precision: 14, numeric_scale: 3 } });
  const definitions = {
    erp_imports: { icon: 'source', label: 'Fuentes ERP', template: '{{filename}}', fields: [field('filename'), unique('file_hash'), count('file_size'), field('source_file', 'uuid'), choices('status', ['processing', 'completed', 'interrupted'], 'processing'), field('summary', 'json'), field('progress', 'json'), field('source_sheet'), field('completed_at', 'timestamp'), field('last_error', 'text')] },
    erp_items: { icon: 'inventory_2', label: 'Referencial Artimex', template: '{{internal_code}} · {{name}}', fields: [unique('internal_code'), unique('source_key'), field('name'), choices('item_type', ['unclassified', 'finished_good', 'raw_material', 'packaging', 'supply', 'service', 'intermediate'], 'unclassified'), unique('globalbake_code'), field('is_report_item', 'boolean', { schema: { default_value: false } }), field('is_component', 'boolean', { schema: { default_value: false } }), field('source_rows', 'json'), field('source_import', 'uuid'), field('default_unit'), field('notes', 'text')] },
    erp_recipes: { icon: 'menu_book', label: 'Formulaciones', template: '{{item.name}} · variante {{variant}}', fields: [field('item', 'uuid'), unique('import_key'), field('composition_hash'), count('variant'), choices('status', ['imported', 'archived'], 'imported'), count('line_count'), decimal('total_percentage'), field('has_self_reference', 'boolean'), field('has_conflict', 'boolean'), decimal('yield_quantity'), field('yield_unit'), field('notes', 'text')] },
    erp_recipe_lines: { icon: 'format_list_bulleted', label: 'Componentes de formulación', template: '{{component.name}}', fields: [field('recipe', 'uuid'), field('component', 'uuid'), decimal('percentage'), field('source_percentage'), field('source_name'), count('source_row'), count('sort'), decimal('quantity'), field('unit')] },
    erp_recipe_sources: { icon: 'history', label: 'Trazabilidad de formulación', template: '{{source_import.filename}}', fields: [field('recipe', 'uuid'), field('source_import', 'uuid'), field('occurrences', 'json')] },
  };
  return { definitions, relationships: [
    ['erp_imports', 'source_file', 'directus_files'], ['erp_items', 'source_import', 'erp_imports'],
    ['erp_recipes', 'item', 'erp_items', 'recipes'], ['erp_recipe_lines', 'recipe', 'erp_recipes', 'lines'],
    ['erp_recipe_lines', 'component', 'erp_items'], ['erp_recipe_sources', 'recipe', 'erp_recipes', 'sources'],
    ['erp_recipe_sources', 'source_import', 'erp_imports'], ['commerce_products', 'item', 'erp_items', 'storefronts'],
  ] };
}
