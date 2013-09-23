class CreateRouteImages < ActiveRecord::Migration
  def change
    create_table :route_images do |t|
      t.integer :route_id
      t.string :name

      t.timestamps
    end
  end
end
