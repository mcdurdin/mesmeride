class StravaActivity < ActiveRecord::Base

  def data
    @data ||= JSON.parse(self.raw_data)
  end
end
