class Route < ActiveRecord::Base
  has_many :waypoints, dependent: :destroy
  
  def self.import_from_activity(activity_id)
    activity = StravaActivity.find_by_activity_id(activity_id)
    
    @route = Route.create(:name => activity.name, :source => "StravaActivity", :source_id => activity_id)

    # Count segments that qualify

    segment_count = activity.data["activity"]["segment_efforts"].find_all { |e| e["segment"]["climb_category"] != 0 }.size

    # Create segments
    
    i = 0
    
    activity.data["activity"]["segment_efforts"].each do |e|
      if e["segment"]["climb_category"] != 0
        @route.waypoints.create(:name => e["name"], :distance => activity.data["activity"]["distance"] * i/segment_count, :elevation => 0)
        i = i + 1
      end
    end
    
    # Import stream data
    
    streams = {}
    
    activity.data["streams"].each do |s|
      streams[s["type"]] = s["data"]
    end
    
    @route.streams = streams.to_json
    @route.save
    
    @route
  end
end
