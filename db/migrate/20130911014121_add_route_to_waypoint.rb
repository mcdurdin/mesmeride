class AddRouteToWaypoint < ActiveRecord::Migration
  def change
    add_column :waypoints, :route_id, :integer
  end
end
