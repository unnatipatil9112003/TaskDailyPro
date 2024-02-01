const mongoose = require("mongoose");
const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    image: {
      type: String,
      default:
        "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp",
    },
    phone: {
      type: Number,
      default: 0,
    },
    whatsappNumber: {
      type: Number,
      default: 0,
    },
    dailyTasks: [
      {
        Day: {
          type: String,
        },
        tasks: [
          {
            task: {
              type: Schema.Types.ObjectId,
              ref: "DailyTask",
            },
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
        efficiency: {
          type: Number,
          default: 0,
        },
      },
    ],
    monthlyTasks: [
      {
        Month: {
          type: String,
        },
        tasks: [
          {
            task: {
              type: Schema.Types.ObjectId,
              ref: "DailyTask",
            },
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
        efficiency: {
          type: Number,
          default: 0,
        },
      },
    ],
    yearlyTasks: [
      {
        Year: {
          type: String,
        },
        tasks: [
          {
            task: {
              type: Schema.Types.ObjectId,
              ref: "DailyTask",
            },
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
        efficiency: {
          type: Number,
          default: 0,
        },
      },
    ],
    goals: [
      {
        Name: {
          type: String,
        },
        Goal: {
          type: Schema.Types.ObjectId,
          ref: "Goal",
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("user", UserSchema);

module.exports = User;
