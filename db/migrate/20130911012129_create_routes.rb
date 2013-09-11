class CreateRoutes < ActiveRecord::Migration
  def change
    create_table :routes do |t|
      t.string :name
      t.string :source
      t.string :source_id

      t.timestamps
    end
  end
end
