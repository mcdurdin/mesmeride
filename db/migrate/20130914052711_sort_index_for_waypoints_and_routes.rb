class SortIndexForWaypointsAndRoutes < ActiveRecord::Migration
  def change
    add_index :routes, [:user_id, :name]
    add_index :waypoints, [:route_id, :distance]
  end
end
