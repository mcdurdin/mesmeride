class AddStartAndStopDistanceToRoutes < ActiveRecord::Migration
  def change
    add_column :routes, :crop_start_distance, :integer
    add_column :routes, :crop_stop_distance, :integer
  end
end
