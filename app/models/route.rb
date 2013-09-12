class Route < ActiveRecord::Base
  has_many :waypoints, dependent: :destroy
  
  def self.import_from_activity(activity_id)
    activity = StravaActivity.find_by_activity_id(activity_id)
    
    @route = Route.create(:name => activity.name, :source => "StravaActivity", :source_id => activity_id)

    start_date = DateTime.iso8601(activity.data["activity"]["start_date"]).to_i

    # Import stream data
    
    streams = {}
    
    activity.data["streams"].each do |s|
      streams[s["type"]] = s["data"]
    end
    
    @route.streams = streams.to_json
    
    # Count segments that qualify

    segment_count = activity.data["activity"]["segment_efforts"].find_all { |e| e["segment"]["climb_category"] != 0 }.size

    # Create segments
    
    i = 0

    activity.data["activity"]["segment_efforts"].each do |e|
      if e["segment"]["climb_category"] != 0
        segment_start_date = DateTime.iso8601(e["start_date"]).to_i
        segment_start_index = streams["time"].find_index do |t|
          t + start_date >= segment_start_date + e["elapsed_time"]
        end
        
        # return [segment_start_index, start_date, segment_start_date]
        
        @route.waypoints.create(:name => e["name"], :distance => streams["distance"][segment_start_index], :elevation => streams["altitude"][segment_start_index])
        i = i + 1
      end
    end
    
    @route.save
    
    @route
  end
end
