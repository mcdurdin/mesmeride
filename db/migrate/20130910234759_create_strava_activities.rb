class CreateStravaActivities < ActiveRecord::Migration
  def change
    create_table :strava_activities do |t|
      t.integer :activity_id
      t.string :name
      t.datetime :start_date
      t.text :raw_data

      t.timestamps
    end
  end
end
