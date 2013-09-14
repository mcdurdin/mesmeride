class RouteScaleValues < ActiveRecord::Migration
  def change
    add_column :routes, :zoom, :integer
    add_column :routes, :x_scale, :integer
    add_column :routes, :y_scale, :integer    
  end
end
