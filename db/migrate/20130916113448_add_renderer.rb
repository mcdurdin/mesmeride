class AddRenderer < ActiveRecord::Migration
  def change
    add_column :routes, :renderer, :string
    add_column :routes, :renderer_options, :text
  end
end
