class CreateWaypoints < ActiveRecord::Migration
  def change
    create_table :waypoints do |t|
      t.string :name
      t.integer :distance
      t.integer :elevation

      t.timestamps
    end
  end
end
