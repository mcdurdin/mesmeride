class AddStreamsToRoutes < ActiveRecord::Migration
  def change
    add_column :routes, :streams, :text
  end
end
