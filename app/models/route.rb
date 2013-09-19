class Route < ActiveRecord::Base
  belongs_to :user
  has_many :waypoints, dependent: :destroy
  accepts_nested_attributes_for :waypoints, :allow_destroy => true
  
  def self.import_from_activity(activity_id, user_id, effort_id)
    activity = StravaActivity.find_by_activity_id(activity_id)
    
    @route = Route.create(:name => activity.name, :source => "StravaActivity", :source_id => activity_id, :user_id => user_id, :zoom => 25, :x_scale => 25, :y_scale => 25)

    start_date = DateTime.iso8601(activity.data["activity"]["start_date"]).to_i

    # Import stream data
    
    streams = {}
    
    activity.data["streams"].each do |s|
      streams[s["type"]] = s["data"]
    end
    
    @route.streams = streams.to_json
    
    #
    # Count segments that qualify
    #
    
    segment_count = activity.data["activity"]["segment_efforts"].find_all { |e| e["segment"]["climb_category"] != 0 }.size

    #
    # Create segments
    #
    
    i = 0

    activity.data["activity"]["segment_efforts"].each do |e|

      segment_start_date = DateTime.iso8601(e["start_date"]).to_i

      segment_start_index = streams["time"].find_index do |t|
        t + start_date >= segment_start_date
      end

      segment_stop_index = streams["time"].find_index do |t|
        t + start_date >= segment_start_date + e["elapsed_time"]
      end

      if e["segment"]["climb_category"] != 0
        @route.waypoints.create(:name => e["name"], :distance => streams["distance"][segment_stop_index], :elevation => streams["altitude"][segment_stop_index])
        i = i + 1
      end
      
      #
      # Crop to a specific effort (any effort, not just climbs)
      #
      
      if e["id"].to_s() == effort_id
        @route.name = e["name"]
        @route.crop_start_distance = streams["distance"][segment_start_index]
        @route.crop_stop_distance = streams["distance"][segment_stop_index]
      end
    end
    
    @route.save
    
    @route
  end
end
